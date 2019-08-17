##
#	@file	btlop2_tocsv.py
#	@brief	Update weapon and skill sheet by MS sheet
#

import	os
import	sys
import	xlrd

# ----------------------------------------------------------------------
#	Constants
SHEETNAME_MS      = 'MS'
SHEETNAME_WEAPON1 = 'Weapon1'
SHEETNAME_WEAPON2 = 'Weapon2'
SHEETNAME_SKILL   = 'Skill'

# ----------------------------------------------------------------------
##	@brief	Output as csv
def output_csv(book, sheet_name, basename):
	sheet = book.sheet_by_name( sheet_name )
	outname = basename + "_" + sheet_name + ".csv"
	with open(outname, mode='w', encoding='utf-8') as outfile:
		i = 0
		ncols = 0
		arr = []
		while i < sheet.ncols:
			val = sheet.cell_value( 0, i )
			if type(val) is not str:
				break
			if val == '':
				break
			arr.append( f'"{val}"' )
			i += 1
		ncols = len(arr)
		outfile.write( ','.join(arr) + '\n' )

		j = 1
		while j < sheet.nrows:
			i = 0
			arr = []
			while i < ncols:
				val = sheet.cell_value( j, i )
				if type(val) is str:
					val = val.replace( '\n', '\\n' )
					arr.append( f'"{val}"' )
				elif type(val) is int or type(val) is float:
					arr.append( str(int(val)) )
				else:
					arr.append( '' )
				i += 1
			outfile.write( ','.join(arr) + '\n' )
			j += 1

# ----------------------------------------------------------------------
#	Main

argv = sys.argv
argc = len(argv)

if argc < 2:
	sys.stdout.write( 'Error: No input file' )
	sys.exit( 1 )

filename = argv[1]
if not os.path.isfile(filename):
	sys.stdout.write( f'Error: File not found : {filename}' )
	sys.exit( 1 )

basename, ext = os.path.splitext( filename )

book = xlrd.open_workbook( filename )
output_csv( book, SHEETNAME_MS, basename )
output_csv( book, SHEETNAME_WEAPON1, basename )
output_csv( book, SHEETNAME_WEAPON2, basename )
output_csv( book, SHEETNAME_SKILL, basename )

sys.exit( 0 )
