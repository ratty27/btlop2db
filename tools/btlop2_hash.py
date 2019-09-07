##
#	@file	btlop2_hash.py
#	@brief	Update hash of referenced files
#

import	os
import	sys
import	re
import	hashlib

# ----------------------------------------------------------------------
#	Constants
BLOCK_SIZE = 4096

BTLOP2DB_FILES = [
	'css/style.css',
	'js/btlop2db.js',
	'js/database.js',
	'js/binutil.js',
	'js/util.js',
	'db/btlop2_MS.csv',
	'db/btlop2_Weapon1.csv',
	'db/btlop2_Weapon2.csv',
	'db/btlop2_SubWeapon.csv',
	'db/btlop2_Skill.csv',
	'db/btlop2_CustomParts.csv',
	'db/btlop2_Enhancement.csv'
]

REFERENCED_FILES = [
	'index.html',
	'js/btlop2db.js',
]

# ----------------------------------------------------------------------
##	@brief	Calculate hash of specify file
#	@param	filename	Filename
#	@return	Hash as hex text
def calc_sha1(filename):
	sha1 = hashlib.sha1()
	with open(filename, 'rb') as file:
		while True:
			data = file.read( BLOCK_SIZE )
			if not data:
				break
			sha1.update(data)
	return sha1.hexdigest()

# ----------------------------------------------------------------------
##	@brief	Replace hash text into specify file
def replace_references(filename, hashes):
	i = 0
	while i < len(hashes):
		if len(hashes[i]) < 3:
			hashes[i].append( re.compile('".*' + hashes[i][0] + r'\?v=(.*)"') )
		i += 1

	temp_filename = os.path.join( os.path.dirname(filename), '__hash_temp__' )
	modified = False
	with open(filename, 'r', encoding='utf-8') as infile:
		with open(temp_filename, 'w', encoding='utf-8') as outfile:
			while True:
				line = infile.readline()
				if not line:
					break
				for hash_ in hashes:
					res = hash_[2].search( line )
					if res:
						line = line[0:res.start(1)] + hash_[1] + line[res.end(1):]
						modified = True
				outfile.write( line )
	if modified:
		os.remove( filename )
		os.rename( temp_filename, filename )

# ----------------------------------------------------------------------

argv = sys.argv
argc = len(argv)

if argc < 2:
	sys.stdout.write( 'Error: No input file' )
	sys.exit( 1 )

# Calculate hashes for each files
root = argv[1]
pending = []
hashes = []
for path in BTLOP2DB_FILES:
	if path in REFERENCED_FILES:
		pending.append( path )
		continue
	hexhash = calc_sha1( os.path.join(root, path) )
	hashes.append( [os.path.basename(path), hexhash] )

# Replace hash values to referenced sources
for path in pending:
	replace_references( os.path.join(root, path), hashes )

# Calculate hashes for pending files
for path in pending:
	hexhash = calc_sha1( os.path.join(root, path) )
	hashes.append( [os.path.basename(path), hexhash] )

# Replace hash values to referenced sources
for path in REFERENCED_FILES:
	if path in pending:
		continue
	replace_references( os.path.join(root, path), hashes )

# Test
for elem in hashes:
	print( elem[0] + ': ' + elem[1] )

#
sys.exit( 0 )
