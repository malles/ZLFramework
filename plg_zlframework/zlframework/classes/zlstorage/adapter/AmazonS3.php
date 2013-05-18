<?php
/**
* @package		ZL Framework
* @author    	JOOlanders, SL http://www.zoolanders.com
* @copyright 	Copyright (C) JOOlanders, SL
* @license   	http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 only
*/

// no direct access
defined('_JEXEC') or die('Restricted access');

// register necesary classes
App::getInstance('zoo')->loader->register('AEUtilAmazons3', 'classes:amazons3.php');

// import library dependencies
jimport('joomla.filesystem.file');

/**
 * ZLStorage Amazon S3 Adapter class
 */
class ZLStorageAdapterAmazonS3 extends ZLStorageAdapterBase implements ZLStorageAdapter {

	/**
	 * A reference to the global App object
	 *
	 * @var App
	 */
	public $app;

	/**
	 * A reference to the Amazon S3 Utility class
	 *
	 * @var s3
	 */
	protected $s3;

	/**
	 * A reference to the Amazon S3 Bucket
	 *
	 * @var Bucket
	 */
	protected $bucket;

	/**
	 * Class Constructor
	 */
	public function __construct($options) {

		// init vars
		$this->app = App::getInstance('zoo');

		// init S3 Utility
		$this->s3 = AEUtilAmazons3::getInstance($options['accesskey'], $options['secretkey'], false);

		// store bucket reference
		$this->bucket = $options['bucket'];
	}

	/**
	 * Check if a file exists in the filesystem selected
	 * 
	 * @param string $file The filename (or path)
	 * 
	 * @return boolean The success of the operation
	 */
	public function exists($file) {}

	/**
	 * Writes a file to the filesystem selected
	 * 
	 * @param string $file The filename (or path)
	 * @param mixed $content The content to write
	 * 
	 * @return boolean The success of the operation
	 */
	public function write($file, $content, $overwrite = true){
	}

	/**
	 * Reads a file content from the filesystem selected
	 * 
	 * @param string file The filename (or path)
	 * 
	 * @return mixed The content of the file
	 */
	public function read($file) {}

	/**
	 * Creates a folder
	 *
 	 * @param string $path The path to the new object
	 *
	 * @return boolean The success of the operation
	 */
	public function createFolder($path)
	{
		$result = false;

		// create
		$result = $this->s3->putObject(
			'',
			$this->bucket,
			$path,
			AEUtilAmazons3::ACL_BUCKET_OWNER_FULL_CONTROL,
			array(),
			array()
		);

		// propagate S3 object errors to storage object
		$this->s3->propagateToObject($this);
		
		// if something went wrong, report
		if ($result !== true) {
			$result = false;
			$this->setError('Something went wrong, the task was not performed.');
		}

		return $result;
	}

	/**
	 * Moves an object
	 *
 	 * @param string $src The path to the source file
	 * @param string $dest The path to the destination file
	 *
	 * @return boolean The success of the operation
	 */
	public function move($src, $dest)
	{
		$result = false;

		// if is folder
		if (preg_match('/\/$/', $src)) { // they have a slash at the end

			// check if the folder is empty
			$objects = $this->s3->getBucket($this->bucket, $src, null, 20);

			// unset the folder being deleted
			unset($objects[$src]);

			// if they are objects in the folder, cancel
			if (!empty($objects)) {
				$this->setError('You must empty the folder content first.');
				return false;
			}
		}

		// Copy the object
		$result = $this->s3->copyObject(
			$this->bucket,
			$src,
			$this->bucket,
			$dest,
			AEUtilAmazons3::ACL_BUCKET_OWNER_FULL_CONTROL,
			array(),
			array()
		);

		// if copy success delete the original object
		if ($result === true) {
			$this->delete($src);
		}

		// propagate S3 object errors to storage object
		$this->s3->propagateToObject($this);

		// if something went wrong, report
		if ($result !== true) {
			$result = false;
			$this->setError('Something went wrong, the task was not performed.');
		}

		return $result;
	}

	/**
	 * Moves an uploaded file to a destination folder
	 * 
	 * @param string $file The name of the php (temporary) uploaded file
	 * @param string $dest The path (including filename) to move the uploaded file to
	 * 
	 * @return boolean The success of the operation
	 */
	public function upload($file, $dest)
	{
		$rrs = false;
		$absolute_filename = $this->app->path->path('zlfw:changelog.txt');
		// Legacy single part uploads
		$result = $this->s3->putObject(
			AEUtilAmazons3::inputFile( $absolute_filename, false ),		// File to read from
			'milcom.testing',													// Bucket name
			'changelog.txt',													// Remote relative filename, including directory
			AEUtilAmazons3::ACL_BUCKET_OWNER_FULL_CONTROL,				// ACL (bucket owner has full control, file owner gets full control)
			array(),													// Meta headers
			// Other request headers
			array(
				// Amazon storage class (support for RRS - Reduced Redundancy Storage)
				'x-amz-storage-class'	=> $rrs ? 'REDUCED_REDUNDANCY' : 'STANDARD'
			)
		);

		// $this->s3->setError('You have not set up your Amazon S3 Access Key');
	}

	/**
	 * Deletes an asset from the filesystem selected
	 * 
	 * @param string $path The path to the asset
	 * 
	 * @return boolean The success of the operation
	 */
	public function delete($path)
	{
		$result = false;

		// if is folder
		if (preg_match('/\/$/', $path)) { // they have a slash at the end

			// check if the folder is empty
			$objects = $this->s3->getBucket($this->bucket, $path, null, 20);

			// unset the folder being deleted
			unset($objects[$path]);

			// if they are objects in the folder, cancel
			if (!empty($objects)) {
				$this->setError('You must empty the folder content first.');
				return false;
			}
		}

		// delete the object
		$result = $this->s3->deleteObject(
			$this->bucket,
			$path
		);

		// propagate S3 object errors to storage object
		$this->s3->propagateToObject($this);

		// if something went wrong, report
		if ($result !== true) {
			$result = false;
			$this->setError('Something went wrong, the task was not performed.');
		}

		return $result;
	}

	/**
	 * Get a Folder/File tree list
	 * 
	 * @param string $root The path to the root folder
	 * 
	 * @return boolean The success of the operation
	 */
	public function getTree($root, $legalExt)
	{
		// init vars
		$rows = array();
		$prefix = $root ? $root . '/' : '';

		// get range of objects
		$objects = $this->s3->getBucket($this->bucket, $prefix, null, null, '/', true);

		// folders
		foreach ($objects as $name => $obj) 
		{
			// skip root folder
			if(!isset($obj['prefix']) && $obj['size'] == 0) {
				unset($objects[$name]);
				continue;
			}

			// if folder
			if(isset($obj['prefix'])) {
				$row = array('type' => 'folder');
				$row['name'] = basename($name);
				$row['path'] = basename($obj['prefix']);

				// details
				$row['details'] = array();
				$row['details']['Name'] = $row['name'];

				$rows[] = $row;

				unset($objects[$name]);
			}
		}

		// files
		foreach ($objects as $name => $obj) 
		{
			$row = array('type' => 'file');
			$row['name'] = basename($name);
			$row['path'] = basename($name);
			$row['size']['value'] = $obj['size'];
			$row['size']['display'] = $this->app->zlfilesystem->formatFilesize($row['size']['value'], 'KB');

			// details
			$row['details'] = array();
			$row['details']['File'] = basename($row['name'], '.' . JFile::getExt($row['name']));
			$row['details']['Type'] = $this->app->zlfilesystem->getContentType($row['name']);
			$row['details']['Size'] = $row['size']['display'];

			$rows[] = $row;
		}
		
		// return list
		return compact('root', 'rows');
	}
}