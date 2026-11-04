<?php
/**
 * Server-side block editing for the block abilities.
 *
 * In the browser, snn/edit-block-content and snn/generate-block-pattern only return
 * a client_command for the editor to apply. An MCP client has no editor, so the
 * change would never be saved. When the call comes through the MCP server, these
 * helpers apply the same operations to the stored post content and save it.
 *
 * Indexes refer to the top-level blocks of the post, as the editor lists them.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/** Top-level blocks of a post, without the empty freeform chunks WordPress keeps between them. */
function snn_block_edit_top_level( $content ) {
    return array_values( array_filter( parse_blocks( (string) $content ), function ( $block ) {
        return ! empty( $block['blockName'] );
    } ) );
}

/** Block markup from a snippet: block markup as given, or HTML converted to blocks. Returns a block list. */
function snn_block_edit_blocks_from_content( $content, $allow_code ) {
    $content = (string) $content;
    if ( false === strpos( $content, '<!-- wp:' ) ) {
        $prepared = snn_blocks_prepare_content( $content, true, $allow_code );
        $content  = $prepared['markup'];
    }
    return array_values( array_filter( parse_blocks( $content ), function ( $block ) {
        return ! empty( $block['blockName'] );
    } ) );
}

/** Plain text of one block, including the text of its inner blocks. */
function snn_block_edit_text( array $block ) {
    $text = wp_strip_all_tags( (string) ( $block['innerHTML'] ?? '' ) );
    foreach ( $block['innerBlocks'] ?? array() as $inner ) {
        $text .= ' ' . snn_block_edit_text( $inner );
    }
    return trim( preg_replace( '/\s+/', ' ', $text ) );
}

/** Level of a heading block (2 when unset). */
function snn_block_edit_heading_level( array $block ) {
    return (int) ( $block['attrs']['level'] ?? 2 );
}

/** Index of the heading that a section identifier points at: an anchor first, then the heading text. -1 when none. */
function snn_block_edit_find_section( array $blocks, $anchor, $identifier ) {
    foreach ( $blocks as $index => $block ) {
        if ( '' !== (string) $anchor && ( $block['attrs']['anchor'] ?? '' ) === $anchor ) {
            return $index;
        }
    }
    if ( '' === (string) $identifier ) {
        return -1;
    }
    $needle = mb_strtolower( trim( $identifier ) );
    foreach ( $blocks as $index => $block ) {
        if ( 'core/heading' !== ( $block['blockName'] ?? '' ) ) {
            continue;
        }
        if ( false !== mb_strpos( mb_strtolower( snn_block_edit_text( $block ) ), $needle ) ) {
            return $index;
        }
    }
    return -1;
}

/** Replace text inside the HTML of blocks (innerContent and nested blocks). Returns the number of replacements. */
function snn_block_edit_replace_text( array &$blocks, $find, $replace, array $types, &$count ) {
    foreach ( $blocks as &$block ) {
        if ( empty( $types ) || in_array( $block['blockName'], $types, true ) ) {
            foreach ( $block['innerContent'] as $i => $chunk ) {
                if ( is_string( $chunk ) && false !== strpos( $chunk, $find ) ) {
                    $count += substr_count( $chunk, $find );
                    $block['innerContent'][ $i ] = str_replace( $find, $replace, $chunk );
                }
            }
        }
        if ( ! empty( $block['innerBlocks'] ) ) {
            snn_block_edit_replace_text( $block['innerBlocks'], $find, $replace, $types, $count );
        }
    }
    unset( $block );
}

/**
 * Apply one edit of snn/edit-block-content to a post and save it.
 *
 * @return array|WP_Error { post_id, action, blocks_affected, message, edit_url }
 */
function snn_block_edit_apply( $post_id, array $input ) {
    $post = get_post( $post_id );
    if ( ! $post ) {
        return new WP_Error( 'invalid_post', __( 'Post not found.', 'snn' ) );
    }

    $action   = (string) ( $input['action'] ?? '' );
    $allow    = current_user_can( 'unfiltered_html' );
    $blocks   = snn_block_edit_top_level( $post->post_content );
    $count    = count( $blocks );
    $affected = 0;
    $message  = '';

    $index_of = function ( $key ) use ( $input, $count ) {
        $value = $input[ $key ] ?? null;
        if ( null === $value ) {
            return null;
        }
        $value = (int) $value;
        return $value < 0 ? $count + $value : $value;
    };

    switch ( $action ) {
        case 'insert_at_index': {
            if ( ! isset( $input['content'], $input['insert_index'] ) ) {
                return new WP_Error( 'missing_params', __( 'content and insert_index are required for insert_at_index.', 'snn' ) );
            }
            $new   = snn_block_edit_blocks_from_content( $input['content'], $allow );
            // insert_index: 0 is the start, -1 is the end (after the last block).
            $raw   = (int) $input['insert_index'];
            $at    = $raw < 0 ? $count + $raw + 1 : $raw;
            $at    = max( 0, min( $count, $at ) );
            array_splice( $blocks, $at, 0, $new );
            $affected = count( $new );
            $message  = sprintf( 'Inserted %d block(s) at position %d.', $affected, $at );
            break;
        }

        case 'replace_block_range': {
            if ( ! isset( $input['content'], $input['start_index'], $input['end_index'] ) ) {
                return new WP_Error( 'missing_params', __( 'content, start_index and end_index are required for replace_block_range.', 'snn' ) );
            }
            $start = $index_of( 'start_index' );
            $end   = $index_of( 'end_index' );
            if ( $start < 0 || $end < $start || $end >= $count ) {
                return new WP_Error( 'invalid_range', sprintf( 'Range %d-%d is outside the post (%d blocks).', $start, $end, $count ) );
            }
            $new = snn_block_edit_blocks_from_content( $input['content'], $allow );
            array_splice( $blocks, $start, $end - $start + 1, $new );
            $affected = count( $new );
            $message  = sprintf( 'Replaced blocks %d-%d with %d block(s).', $start, $end, $affected );
            break;
        }

        case 'delete_blocks': {
            if ( ! isset( $input['start_index'] ) ) {
                return new WP_Error( 'missing_params', __( 'start_index is required for delete_blocks.', 'snn' ) );
            }
            $start = $index_of( 'start_index' );
            $end   = isset( $input['end_index'] ) ? $index_of( 'end_index' ) : $start;
            if ( $start < 0 || $end < $start || $end >= $count ) {
                return new WP_Error( 'invalid_range', sprintf( 'Range %d-%d is outside the post (%d blocks).', $start, $end, $count ) );
            }
            array_splice( $blocks, $start, $end - $start + 1 );
            $affected = $end - $start + 1;
            $message  = sprintf( 'Deleted %d block(s).', $affected );
            break;
        }

        case 'find_and_replace_section': {
            if ( ! isset( $input['content'] ) ) {
                return new WP_Error( 'missing_params', __( 'content is required for find_and_replace_section.', 'snn' ) );
            }
            $found = snn_block_edit_find_section( $blocks, $input['anchor'] ?? '', $input['section_identifier'] ?? '' );
            if ( -1 === $found && isset( $input['block_index'] ) ) {
                $found = $index_of( 'block_index' );
            }
            if ( -1 === $found || null === $found ) {
                if ( ! empty( $input['fallback_to_append'] ) ) {
                    $found = $count;
                    $new   = snn_block_edit_blocks_from_content( $input['content'], $allow );
                    array_splice( $blocks, $count, 0, $new );
                    $affected = count( $new );
                    $message  = sprintf( 'Section not found; appended %d block(s).', $affected );
                    break;
                }
                return new WP_Error( 'section_not_found', __( 'No heading matches the anchor or section_identifier. Read the post with snn/get-post-content first.', 'snn' ) );
            }
            // The section runs from its heading to the next heading.
            $end = $found + 1;
            while ( $end < $count && 'core/heading' !== $blocks[ $end ]['blockName'] ) {
                $end++;
            }
            $new = snn_block_edit_blocks_from_content( $input['content'], $allow );
            array_splice( $blocks, $found, $end - $found, $new );
            $affected = count( $new );
            $message  = sprintf( 'Replaced the section at block %d (%d block(s) now).', $found, $affected );
            break;
        }

        case 'find_and_replace_text': {
            if ( ! isset( $input['find_text'], $input['replace_text'] ) || '' === (string) $input['find_text'] ) {
                return new WP_Error( 'missing_params', __( 'find_text and replace_text are required for find_and_replace_text.', 'snn' ) );
            }
            $types = is_array( $input['block_types'] ?? null ) ? $input['block_types'] : array();
            snn_block_edit_replace_text( $blocks, (string) $input['find_text'], (string) $input['replace_text'], $types, $affected );
            $message = sprintf( 'Replaced %d occurrence(s).', $affected );
            break;
        }

        default:
            return new WP_Error( 'invalid_action', __( 'Invalid action specified.', 'snn' ) );
    }

    $markup = serialize_blocks( $blocks );
    $result = wp_update_post( wp_slash( array( 'ID' => $post_id, 'post_content' => $markup ) ), true );
    if ( is_wp_error( $result ) ) {
        return $result;
    }

    return array(
        'post_id'         => (int) $post_id,
        'action'          => $action,
        'blocks_affected' => $affected,
        'saved'           => true,
        'message'         => $message . ' Saved.',
        'edit_url'        => get_edit_post_link( $post_id, 'raw' ),
    );
}

/**
 * Apply a generated pattern (snn/generate-block-pattern) to a post and save it.
 *
 * @return array|WP_Error
 */
function snn_block_pattern_apply( $post_id, $markup, $action_type ) {
    $post = get_post( $post_id );
    if ( ! $post ) {
        return new WP_Error( 'invalid_post', __( 'Post not found.', 'snn' ) );
    }
    $existing = trim( (string) $post->post_content );
    $markup   = trim( (string) $markup );
    switch ( $action_type ) {
        case 'replace':
            $content = $markup;
            break;
        case 'prepend':
            $content = '' === $existing ? $markup : $markup . "\n\n" . $existing;
            break;
        default:
            $content = '' === $existing ? $markup : $existing . "\n\n" . $markup;
    }
    $result = wp_update_post( wp_slash( array( 'ID' => $post_id, 'post_content' => $content ) ), true );
    if ( is_wp_error( $result ) ) {
        return $result;
    }
    return array(
        'post_id'  => (int) $post_id,
        'saved'    => true,
        'edit_url' => get_edit_post_link( $post_id, 'raw' ),
    );
}
