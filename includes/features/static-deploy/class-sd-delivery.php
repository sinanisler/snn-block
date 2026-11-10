<?php
/**
 * Static Deploy: getting the finished files out.
 *
 * ZIP: files are added in batches. Each batch opens the archive, adds a few files
 * and closes it, so the work fits in short steps.
 * Local: files are copied in batches into the chosen folder. The folder can be
 * emptied first, but only after a check that it is not WordPress itself or a folder
 * that contains WordPress.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_Delivery {

	/**
	 * Every file under the export folder, as sorted relative paths with forward slashes.
	 *
	 * @param string $site_dir Export folder.
	 * @return string[]
	 */
	public static function list_files( $site_dir ) {
		$files = array();
		if ( ! is_dir( $site_dir ) ) {
			return $files;
		}
		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $site_dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::LEAVES_ONLY
		);
		$root = wp_normalize_path( rtrim( $site_dir, '/\\' ) ) . '/';
		foreach ( $iterator as $file ) {
			if ( ! $file->isFile() ) {
				continue;
			}
			$path    = wp_normalize_path( $file->getPathname() );
			$files[] = ltrim( substr( $path, strlen( $root ) ), '/' );
		}
		sort( $files, SORT_STRING );
		return $files;
	}

	/**
	 * Check the local destination and prepare it.
	 *
	 * @param string $dir   Absolute folder.
	 * @param bool   $clear Empty the folder first.
	 * @return true|WP_Error
	 */
	public static function prepare_local_dir( $dir, $clear ) {
		if ( '' === $dir ) {
			return new WP_Error( 'snn_sd_no_dir', __( 'Choose a local folder for the export.', 'snn' ) );
		}

		$dir = wp_normalize_path( $dir );
		if ( self::is_unsafe_destination( $dir ) ) {
			return new WP_Error( 'snn_sd_unsafe_dir', __( 'This folder cannot be used: it is WordPress itself, a folder that contains WordPress, or the drive root.', 'snn' ) );
		}

		if ( ! is_dir( $dir ) && ! wp_mkdir_p( $dir ) ) {
			return new WP_Error( 'snn_sd_mkdir', __( 'The local folder could not be created.', 'snn' ) );
		}
		if ( ! is_writable( $dir ) ) {
			return new WP_Error( 'snn_sd_not_writable', __( 'The local folder is not writable.', 'snn' ) );
		}

		if ( $clear ) {
			self::empty_folder( $dir );
		}

		return true;
	}

	/**
	 * Refuse folders that would delete WordPress or its parents.
	 *
	 * @param string $dir Normalized folder path.
	 * @return bool
	 */
	public static function is_unsafe_destination( $dir ) {
		// Both the path as given and the path after symlinks are resolved must be safe.
		$given = rtrim( wp_normalize_path( (string) $dir ), '/' );
		$real  = realpath( $dir );
		$paths = array( $given );
		if ( false !== $real && wp_normalize_path( $real ) !== $given ) {
			$paths[] = rtrim( wp_normalize_path( $real ), '/' );
		}

		$install = rtrim( wp_normalize_path( (string) realpath( ABSPATH ) ), '/' );
		$uploads = wp_upload_dir( null, false );
		$uploads = rtrim( wp_normalize_path( (string) realpath( $uploads['basedir'] ) ), '/' );
		$install_given = rtrim( wp_normalize_path( ABSPATH ), '/' );

		foreach ( $paths as $path ) {
			if ( '' === $path || preg_match( '#^([a-zA-Z]:)?/?$#', $path ) ) {
				return true; // Drive root or '/'.
			}
			foreach ( array( $install, $install_given ) as $root ) {
				// The WordPress folder itself or any folder above it.
				if ( strtolower( $root ) === strtolower( $path ) || 0 === stripos( $root . '/', $path . '/' ) ) {
					return true;
				}
				// Inside the WordPress folder: only the uploads folder is allowed (core, themes
				// and plugins would be emptied otherwise).
				if ( 0 === stripos( $path . '/', $root . '/' ) && 0 !== stripos( $path . '/', $uploads . '/' ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Remove everything inside a folder, keep the folder.
	 *
	 * @param string $dir Folder.
	 * @return void
	 */
	public static function empty_folder( $dir ) {
		$items = new FilesystemIterator( $dir, FilesystemIterator::SKIP_DOTS );
		foreach ( $items as $item ) {
			if ( $item->isDir() && ! $item->isLink() ) {
				self::remove_tree( $item->getPathname() );
			} else {
				@unlink( $item->getPathname() );
			}
		}
	}

	/**
	 * Remove a folder and everything in it.
	 *
	 * @param string $dir Folder.
	 * @return void
	 */
	public static function remove_tree( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}
		$items = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $items as $item ) {
			if ( $item->isDir() && ! $item->isLink() ) {
				@rmdir( $item->getPathname() );
			} else {
				@unlink( $item->getPathname() );
			}
		}
		@rmdir( $dir );
	}

	/**
	 * Copy one batch of files into the local folder.
	 *
	 * @param string   $site_dir Export folder.
	 * @param string   $dest_dir Destination folder.
	 * @param string[] $files    All files (relative paths).
	 * @param int      $offset   First index to copy.
	 * @param int      $count    How many to copy in this batch.
	 * @return array { copied: int, next: int, error: string }
	 */
	public static function copy_batch( $site_dir, $dest_dir, array $files, $offset, $count ) {
		$copied = 0;
		$index  = (int) $offset;
		$end    = min( count( $files ), $index + max( 1, (int) $count ) );

		for ( ; $index < $end; $index++ ) {
			$relative = $files[ $index ];
			$source   = trailingslashit( $site_dir ) . $relative;
			$target   = trailingslashit( $dest_dir ) . $relative;
			if ( ! wp_mkdir_p( dirname( $target ) ) ) {
				return array( 'copied' => $copied, 'next' => $index, 'error' => 'Unable to create folder for ' . $relative );
			}
			if ( ! @copy( $source, $target ) ) {
				return array( 'copied' => $copied, 'next' => $index, 'error' => 'Unable to copy ' . $relative );
			}
			$copied++;
		}

		return array( 'copied' => $copied, 'next' => $index, 'error' => '' );
	}

	/**
	 * Add one batch of files to the ZIP. The first batch creates the archive.
	 *
	 * @param string   $site_dir Export folder.
	 * @param string   $zip_path Archive path.
	 * @param string[] $files    All files (relative paths).
	 * @param int      $offset   First index to add.
	 * @param int      $count    How many to add.
	 * @return array { added: int, next: int, error: string }
	 */
	public static function zip_batch( $site_dir, $zip_path, array $files, $offset, $count ) {
		if ( ! class_exists( 'ZipArchive' ) ) {
			return array( 'added' => 0, 'next' => (int) $offset, 'error' => 'The PHP zip extension is not available on this server.' );
		}

		$zip    = new ZipArchive();
		$flags  = 0 === (int) $offset ? ZipArchive::CREATE | ZipArchive::OVERWRITE : 0;
		$opened = $zip->open( $zip_path, $flags );
		if ( true !== $opened ) {
			return array( 'added' => 0, 'next' => (int) $offset, 'error' => 'Unable to open the ZIP archive (code ' . (int) $opened . ').' );
		}

		$added = 0;
		$index = (int) $offset;
		$end   = min( count( $files ), $index + max( 1, (int) $count ) );
		for ( ; $index < $end; $index++ ) {
			$relative = $files[ $index ];
			if ( ! $zip->addFile( trailingslashit( $site_dir ) . $relative, $relative ) ) {
				$zip->close();
				return array( 'added' => $added, 'next' => $index, 'error' => 'Unable to add ' . $relative . ' to the ZIP archive.' );
			}
			$added++;
		}

		if ( ! $zip->close() ) {
			return array( 'added' => 0, 'next' => (int) $offset, 'error' => 'Unable to write the ZIP archive.' );
		}

		return array( 'added' => $added, 'next' => $index, 'error' => '' );
	}

	/**
	 * Folder for the ZIP and the working files of one export.
	 *
	 * @return string Absolute folder path, created with a guard file.
	 */
	public static function work_root() {
		$uploads = wp_upload_dir( null, false );
		$root    = trailingslashit( $uploads['basedir'] ) . 'snn-static-deploy';
		if ( ! is_dir( $root ) ) {
			wp_mkdir_p( $root );
		}
		self::guard( $root );
		return $root;
	}

	/**
	 * Keep directory listings off: an index file and an .htaccess for Apache-style servers.
	 *
	 * @param string $dir Folder.
	 * @return void
	 */
	public static function guard( $dir ) {
		if ( ! file_exists( trailingslashit( $dir ) . 'index.php' ) ) {
			@file_put_contents( trailingslashit( $dir ) . 'index.php', "<?php\n// Silence is golden.\n" );
		}
		if ( ! file_exists( trailingslashit( $dir ) . '.htaccess' ) ) {
			@file_put_contents( trailingslashit( $dir ) . '.htaccess', "Options -Indexes\nRequire all denied\n" );
		}
	}
}
