<?php
/**
 * Static Deploy: fetch one URL and save its output.
 *
 * Decision table for a response:
 *   200                      save the file (text is rewritten first)
 *   301 302 303 307 308      follow the target when it is the same page; otherwise write a redirect page
 *   404 and other 4xx        record the status, no file
 *   408 425 429 5xx, errors  retry later (up to MAX_ATTEMPTS), then failed
 *
 * Local assets (images, CSS, JS, fonts) that exist on disk are copied directly, which
 * is faster and avoids requests to the server that is also running the export.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_Fetcher {

	const TIMEOUT    = 30;
	const USER_AGENT = 'SNN-Static-Deploy/1.0';

	/**
	 * Fetch one queue row and save what it produces.
	 *
	 * @param object $row Row from SNN_Static_Deploy_Pages.
	 * @param array  $ctx Context: site_dir, tmp_dir, settings.
	 * @return array Result: state, status, content_type, file_path, redirect_url, discovered, message, error.
	 */
	public static function process( $row, array $ctx ) {
		$url      = (string) $row->url;
		$settings = $ctx['settings'];
		$result   = array(
			'state'        => SNN_Static_Deploy_Pages::STATE_DONE,
			'status'       => null,
			'content_type' => null,
			'file_path'    => null,
			'redirect_url' => null,
			'discovered'   => array(),
			'message'      => '',
			'error'        => '',
			'retry'        => false,
		);

		// Additional files: copied from their disk path.
		if ( 'file' === $row->handler ) {
			return self::copy_additional_file( $row, $ctx, $result );
		}

		if ( ! SNN_Static_Deploy_URL::is_local( $url ) ) {
			$result['state']   = SNN_Static_Deploy_Pages::STATE_SKIPPED;
			$result['message'] = 'Not a local URL';
			return $result;
		}

		if ( SNN_Static_Deploy_URL::is_excluded( $url, $settings ) ) {
			$result['state']   = SNN_Static_Deploy_Pages::STATE_SKIPPED;
			$result['message'] = 'Excluded by the export settings';
			return $result;
		}

		// The output path this URL would be saved to. The result records it only when a file is written.
		$file_path = SNN_Static_Deploy_URL::file_path_for( $url );

		// Local asset on disk: no request needed.
		if ( SNN_Static_Deploy_URL::is_asset( $url ) ) {
			$disk = SNN_Static_Deploy_URL::disk_path( $url );
			if ( '' !== $disk ) {
				return self::from_disk( $disk, $url, $file_path, $ctx, $result );
			}
		}

		// Binary files are streamed to a temp file; text is read into memory and rewritten.
		$temp = SNN_Static_Deploy_URL::is_binary_asset( $url ) ? trailingslashit( $ctx['tmp_dir'] ) . wp_generate_password( 16, false ) . '.part' : '';
		$resp = wp_remote_get( $url, self::request_args( $url, $settings, $temp ) );

		if ( is_wp_error( $resp ) ) {
			self::discard_temp( $temp );
			return self::retryable( $result, 0, $resp->get_error_message() );
		}

		$code             = (int) wp_remote_retrieve_response_code( $resp );
		$result['status'] = $code;

		if ( in_array( $code, array( 301, 302, 303, 307, 308 ), true ) ) {
			self::discard_temp( $temp );
			return self::redirect( $url, (string) wp_remote_retrieve_header( $resp, 'location' ), $file_path, $settings, $ctx, $result );
		}

		if ( in_array( $code, array( 408, 425, 429 ), true ) || ( $code >= 500 && $code <= 599 ) ) {
			self::discard_temp( $temp );
			return self::retryable( $result, $code, sprintf( 'Temporary HTTP %d response.', $code ) );
		}

		if ( 200 !== $code ) {
			self::discard_temp( $temp );
			$result['state']   = SNN_Static_Deploy_Pages::STATE_MISSING;
			$result['message'] = sprintf( 'HTTP %d, no file written.', $code );
			return $result;
		}

		$content_type = trim( explode( ';', (string) wp_remote_retrieve_header( $resp, 'content-type' ) )[0] );
		if ( '' === $content_type ) {
			$content_type = self::mime_for( $url );
		}
		$result['content_type'] = $content_type;

		$abs = trailingslashit( $ctx['site_dir'] ) . $file_path;

		if ( '' !== $temp ) {
			// Streamed binary download: move the temp file into place.
			return self::store_file( $temp, $abs, $file_path, $result );
		}

		$body = wp_remote_retrieve_body( $resp );

		if ( SNN_Static_Deploy_URL::is_text_document( $url, $content_type ) || self::is_html_type( $content_type ) ) {
			$rewriter = new SNN_Static_Deploy_Rewriter( $url, $file_path, $settings );
			if ( self::is_html_type( $content_type ) || ( '' === SNN_Static_Deploy_URL::extension( $url ) && 'index.html' === basename( $file_path ) ) ) {
				$body = $rewriter->html( $body );
			} elseif ( 'css' === SNN_Static_Deploy_URL::extension( $url ) ) {
				$body = $rewriter->css( $body, $url );
			} else {
				$body = $rewriter->text_file( $body );
			}
			$result['discovered'] = $rewriter->found();
		}

		return self::write( $abs, $body, $file_path, $result );
	}

	/**
	 * Save a string to a file, creating folders as needed.
	 *
	 * @param string $abs       Absolute target path.
	 * @param string $body      Content.
	 * @param string $file_path Export-relative path (recorded in the result).
	 * @param array  $result    Result array.
	 * @return array
	 */
	private static function write( $abs, $body, $file_path, array $result ) {
		if ( ! wp_mkdir_p( dirname( $abs ) ) ) {
			return self::failed( $result, 'Unable to create folder for ' . $file_path );
		}
		if ( false === file_put_contents( $abs, $body ) ) {
			return self::failed( $result, 'Unable to write ' . $file_path );
		}
		$result['file_path'] = $file_path;
		$result['state']     = SNN_Static_Deploy_Pages::STATE_DONE;
		return $result;
	}

	/**
	 * Move a downloaded temp file into the export.
	 *
	 * @param string $temp      Temp file.
	 * @param string $abs       Target path.
	 * @param string $file_path Export-relative path.
	 * @param array  $result    Result array.
	 * @return array
	 */
	private static function store_file( $temp, $abs, $file_path, array $result ) {
		if ( ! file_exists( $temp ) ) {
			return self::failed( $result, 'Download produced no file for ' . $file_path );
		}
		if ( ! wp_mkdir_p( dirname( $abs ) ) ) {
			@unlink( $temp );
			return self::failed( $result, 'Unable to create folder for ' . $file_path );
		}
		if ( ! @rename( $temp, $abs ) && ! @copy( $temp, $abs ) ) {
			@unlink( $temp );
			return self::failed( $result, 'Unable to save ' . $file_path );
		}
		@unlink( $temp );
		$result['file_path'] = $file_path;
		$result['state']     = SNN_Static_Deploy_Pages::STATE_DONE;
		return $result;
	}

	/**
	 * A local asset copied from disk (no HTTP request).
	 */
	private static function from_disk( $disk, $url, $file_path, array $ctx, array $result ) {
		$result['status']       = 200;
		$result['content_type'] = self::mime_for( $url );
		$abs = trailingslashit( $ctx['site_dir'] ) . $file_path;

		if ( SNN_Static_Deploy_URL::is_text_document( $url, $result['content_type'] ) ) {
			$body     = (string) file_get_contents( $disk );
			$rewriter = new SNN_Static_Deploy_Rewriter( $url, $file_path, $ctx['settings'] );
			$body     = 'css' === SNN_Static_Deploy_URL::extension( $url ) ? $rewriter->css( $body, $url ) : $rewriter->text_file( $body );
			$result['discovered'] = $rewriter->found();
			return self::write( $abs, $body, $file_path, $result );
		}

		if ( ! wp_mkdir_p( dirname( $abs ) ) || ! @copy( $disk, $abs ) ) {
			return self::failed( $result, 'Unable to copy ' . $file_path );
		}
		$result['file_path'] = $file_path;
		$result['message']   = 'Copied from disk';
		return $result;
	}

	/**
	 * An additional file from the settings (absolute disk path).
	 */
	private static function copy_additional_file( $row, array $ctx, array $result ) {
		$source = (string) $row->source_path;
		if ( '' === $source || ! is_file( $source ) || ! is_readable( $source ) ) {
			$result['state']   = SNN_Static_Deploy_Pages::STATE_MISSING;
			$result['message'] = 'Additional file not found or not readable';
			return $result;
		}
		$file_path = SNN_Static_Deploy_URL::file_path_for( (string) $row->url );
		$abs       = trailingslashit( $ctx['site_dir'] ) . $file_path;
		$result['status']       = 200;
		$result['content_type'] = self::mime_for( (string) $row->url );

		$name = strtolower( basename( $source ) );
		if ( in_array( $name, array( 'robots.txt', 'llms.txt', '_redirects', '_headers' ), true ) ) {
			$rewriter = new SNN_Static_Deploy_Rewriter( (string) $row->url, $file_path, $ctx['settings'] );
			$body     = $rewriter->text_file( (string) file_get_contents( $source ) );
			$result['discovered'] = $rewriter->found();
			return self::write( $abs, $body, $file_path, $result );
		}

		if ( ! wp_mkdir_p( dirname( $abs ) ) || ! @copy( $source, $abs ) ) {
			return self::failed( $result, 'Unable to copy ' . $file_path );
		}
		$result['file_path'] = $file_path;
		$result['message']   = 'Additional file';
		return $result;
	}

	/**
	 * Redirect handling: follow a same-page redirect, otherwise write a redirect page.
	 */
	private static function redirect( $url, $location, $file_path, array $settings, array $ctx, array $result ) {
		$target = SNN_Static_Deploy_URL::resolve( $location, $url );
		if ( '' === $target ) {
			$result['state']   = SNN_Static_Deploy_Pages::STATE_MISSING;
			$result['message'] = 'Redirect without a usable target';
			return $result;
		}

		$target_clean = SNN_Static_Deploy_URL::normalize( $target );
		$result['redirect_url'] = $target_clean;
		$local                  = SNN_Static_Deploy_URL::is_local( $target_clean );

		// Same page (trailing slash, http/https): queue the target, write nothing here.
		if ( $local && self::same_page( $url, $target_clean ) ) {
			$result['discovered'] = array( $target_clean );
			$result['state']      = SNN_Static_Deploy_Pages::STATE_REDIRECT;
			$result['message']    = 'Same page redirect, target queued';
			return $result;
		}

		// Any other redirect gets a redirect page at this URL's own path, so links to it still work
		// (WordPress sends attachment pages to the file itself, and content links to them).
		if ( $local ) {
			$result['discovered'] = array( $target_clean );
		}

		$link = $local ? SNN_Static_Deploy_URL::link_for( $target_clean . ( '' !== SNN_Static_Deploy_URL::fragment( $target ) ? '#' . SNN_Static_Deploy_URL::fragment( $target ) : '' ), $file_path, $settings ) : $target_clean;
		$html = self::redirect_html( $link );

		$abs = trailingslashit( $ctx['site_dir'] ) . $file_path;
		$out = self::write( $abs, $html, $file_path, $result );
		$out['state']   = SNN_Static_Deploy_Pages::STATE_REDIRECT;
		$out['message'] = 'Redirect page written';
		return $out;
	}

	/**
	 * Whether two URLs differ only by trailing slash or scheme.
	 */
	private static function same_page( $from, $to ) {
		$a = SNN_Static_Deploy_URL::normalize( $from );
		$b = $to;
		$a = preg_replace( '#^https?://#', '', untrailingslashit( $a ) );
		$b = preg_replace( '#^https?://#', '', untrailingslashit( $b ) );
		return $a === $b;
	}

	/**
	 * The page that sends the browser to the target.
	 *
	 * @param string $link Link to the target.
	 * @return string
	 */
	public static function redirect_html( $link ) {
		$safe = esc_url( $link );
		return '<!DOCTYPE html>' . "\n" .
			'<html><head><meta charset="utf-8"><title>Redirecting...</title>' .
			'<meta http-equiv="refresh" content="0;url=' . esc_attr( $link ) . '">' .
			'<link rel="canonical" href="' . $safe . '"></head>' . "\n" .
			'<body><script>window.location.replace(' . wp_json_encode( $link, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ');</script>' .
			'<p>You are being redirected to <a href="' . $safe . '">' . esc_html( $link ) . '</a></p>' .
			'</body></html>';
	}

	/**
	 * Mark a row for another attempt, or as failed when it has no attempts left.
	 */
	private static function retryable( array $result, $code, $message ) {
		$result['retry']   = true;
		$result['state']   = SNN_Static_Deploy_Pages::STATE_PENDING;
		$result['status']  = $code ?: null;
		$result['error']   = $message;
		$result['message'] = $message;
		return $result;
	}

	/**
	 * A failed write or copy.
	 */
	private static function failed( array $result, $message ) {
		$result['state'] = SNN_Static_Deploy_Pages::STATE_FAILED;
		$result['error'] = $message;
		return $result;
	}

	/**
	 * Remove a temp download if one was started.
	 *
	 * @param string $temp Temp file path, or ''.
	 * @return void
	 */
	private static function discard_temp( $temp ) {
		if ( '' !== $temp && file_exists( $temp ) ) {
			@unlink( $temp );
		}
	}

	/**
	 * Request arguments: no automatic redirects (they are handled above), a time limit,
	 * optional Basic Auth for local URLs, and streaming when a temp file is given.
	 *
	 * @param string $url      URL.
	 * @param array  $settings Settings.
	 * @param string $temp     Temp file for a streamed download, or ''.
	 * @return array
	 */
	public static function request_args( $url, array $settings, $temp = '' ) {
		$headers = array( 'Accept-Encoding' => 'identity' );

		$user = isset( $settings['basic_auth_user'] ) ? (string) $settings['basic_auth_user'] : '';
		$pass = isset( $settings['basic_auth_pass'] ) ? (string) $settings['basic_auth_pass'] : '';
		if ( '' !== $user && SNN_Static_Deploy_URL::is_local( $url ) ) {
			$headers['Authorization'] = 'Basic ' . base64_encode( $user . ':' . $pass );
		}

		$args = array(
			'timeout'     => self::TIMEOUT,
			'redirection' => 0,
			'user-agent'  => self::USER_AGENT,
			'headers'     => $headers,
			'sslverify'   => true,
			'decompress'  => true,
		);

		if ( '' !== $temp ) {
			$args['stream']   = true;
			$args['filename'] = $temp;
		}

		return $args;
	}

	/**
	 * Content type from the file extension.
	 */
	public static function mime_for( $url ) {
		$ext = SNN_Static_Deploy_URL::extension( $url );
		if ( '' === $ext ) {
			return 'text/html';
		}
		$map = array(
			'css' => 'text/css', 'js' => 'application/javascript', 'mjs' => 'application/javascript',
			'json' => 'application/json', 'xml' => 'application/xml', 'txt' => 'text/plain',
			'html' => 'text/html', 'htm' => 'text/html', 'svg' => 'image/svg+xml',
			'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf', 'otf' => 'font/otf',
			'pdf' => 'application/pdf', 'zip' => 'application/zip',
		);
		if ( isset( $map[ $ext ] ) ) {
			return $map[ $ext ];
		}
		$type = wp_check_filetype( 'file.' . $ext );
		return ! empty( $type['type'] ) ? $type['type'] : 'application/octet-stream';
	}

	private static function is_html_type( $content_type ) {
		return (bool) preg_match( '#^text/html|^application/xhtml#i', (string) $content_type );
	}
}
