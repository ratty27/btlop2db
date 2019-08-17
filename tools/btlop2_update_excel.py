##
#	@file	btlop2_update_excel.py
#	@brief	Update weapon and skill sheet by MS sheet
#

import	os
import	sys
import	openpyxl

# ----------------------------------------------------------------------
#	Constants
SHEETNAME_MS      = 'MS'
SHEETNAME_WEAPON1 = 'Weapon1'
SHEETNAME_WEAPON2 = 'Weapon2'
SHEETNAME_SKILL   = 'Skill'

# ----------------------------------------------------------------------
##	@brief	Search column
def search_col(sheet, name):
	i = sheet.min_column
	while i <= sheet.max_column:
		val = sheet.cell( row=sheet.min_row, column=i ).value
		if val:
			val = str(val).strip()
			if val == name:
				return i
		i += 1
	return -1

# ----------------------------------------------------------------------
##	@brief	Collect items
def collect_items(sheet, colname):
	ret = []
	col = search_col( sheet, colname )
	if col >= 0:
		temp = {}
		i = sheet.min_row + 1
		while i <= sheet.max_row:
			val = sheet.cell( row=i, column=col ).value
			if type(val) is str:
				items = val.split('\n')
				for item in items:
					name = item.strip()
					if name not in temp:
						temp[name] = 1
			i += 1
		ret = sorted( temp )
	return ret

# ----------------------------------------------------------------------
##	@brief	Update items
def update_items(sheet, items):
	name_col = sheet.min_column
	i0 = sheet.min_row + 1
	i1 = 0
	while i1 < len(items):
		val = sheet.cell( row=i0, column=name_col ).value
		if val:
			val = str(val).strip()
		else:
			val = ''
		if val == '' or val > items[i1]:
			sheet.insert_rows( i0 )
			sheet.cell( row=i0, column=name_col, value=items[i1] )
			i0 += 1
			i1 += 1
		elif val < items[i1]:
			i0 += 1
		else:
			i0 += 1
			i1 += 1

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

book = openpyxl.load_workbook( filename )

sheet_ms = book[SHEETNAME_MS]

weapon1 = collect_items( sheet_ms, 'main_weapon1' )
update_items( book[SHEETNAME_WEAPON1], weapon1 )

weapon2 = collect_items( sheet_ms, 'main_weapon2' )
update_items( book[SHEETNAME_WEAPON2], weapon2 )

skills = collect_items( sheet_ms, 'skills' )
update_items( book[SHEETNAME_SKILL], skills )

book.save( filename )
sys.exit( 0 )
