
// ---------
// Constants
var	PARAM_NAME = {
	"name": "名前",
	"rarity": "レア度",
	"level": "レベル",
	"cost": "コスト",
	"type": "カテゴリ",
	"hp" : "HP",
	"anti_ammo": "耐実弾",
	"anti_beam": "耐ビーム",
	"anti_melee": "耐格闘",
	"ranged": "射撃",
	"melee": "格闘",
	"speed": "スピード",
	"thruster": "スラスター",
	"close_range": "近スロ",
	"medium_range": "中スロ",
	"long_range": "遠スロ",
	"respawn_time": "再出撃",
	"ground": "地上",
	"space": "宇宙",
	"compatibility": "適正",
	"main_weapon1": "主兵装１",
	"main_weapon2": "主兵装２",
	"sub_weapon": "副兵装",
	"skills": "スキル"
}

var FILTER_PARAM = ['cost', 'type', 'level', 'rarity'];
var SORT_PARAM = ['name', 'cost', 'type', 'level', 'rarity'];
var SORT_TYPE = ['昇順', '降順'];

// ---------
// Variables
var	db_ms = null;
var	db_weapon1 = null;
var	db_weapon2 = null;
var	db_skill = null;
var chk_filter = null;
var sel_sort = null;

// ---------
/**	@brief	Filtering rule class
 */
class FilteringRule
{
	//!	@brief	Constructor
	constructor()
	{
		this.enable_columns = null;
		this.filter = {};
		this.sort = [];
		this.show_detail = true;
	}

	//!	@brief	Check whether sorting is required
	require_sort()
	{
		for( var i = 0; i < this.sort.length; ++i )
		{
			if( this.sort[i] )
			{
				if( this.sort[i][0] > 0 )
					return true;
			}
		}
		return false;
	}
}
var filtering_rule = new FilteringRule();

// ---------
/**	@brief	Read file
 */
function read_file(url, func)
{
	var	req = new XMLHttpRequest();
	req.open( "GET", url, false ); 
	req.onreadystatechange = function()
	{
		if( req.readyState === 4 )
		{
			if( req.status === 200 || req.status == 0 )
			{
				func( req.responseText );
			}
		}
	}
	req.send();
}

// ---------
/**	@brief	Initialize MS DB
 */
function init_ms_db()
{
	var	idx_type = db_ms.searchColumn( 'type' );
	var	idx_compati = db_ms.searchColumn( 'compatibility' );
	for( var i = 0; i < db_ms.getRecordNum(); ++i )
	{
		var	type = db_ms.raw[i][idx_type];
		if( type == 'general' )
			db_ms.raw[i][idx_type] = '汎用';
		else if( type == 'raid' )
			db_ms.raw[i][idx_type] = '強襲';
		else if( type == 'support' )
			db_ms.raw[i][idx_type] = '支援';

		var	compati = db_ms.raw[i][idx_compati];
		if( compati == 'G' )
			db_ms.raw[i][idx_compati] = '地上'
		else if( compati == 'S' )
			db_ms.raw[i][idx_compati] = '宇宙'
	}
}

// ---------
/**	@brief	Add filter check-boxs
 */
function add_filter(tbl, name, id_, arr)
{
	var ret = []

	var	row = tbl.insertRow(-1);

	var	cell0 = row.insertCell(-1);
	cell0.innerHTML = name;
	cell0.style.width = '100px';
	cell0.style.fontSize = 'small';

	var	cell1 = row.insertCell(-1);
	cell1.style.width = '924px';
	cell1.style.display = 'inline-flex';
	cell1.style.flexWrap = 'wrap';
	for( var i = 0; i < arr.length; ++i )
	{
		if( arr[i] == '' )
			continue;

		var chkname = 'chk_' + id_ + '_' + arr[i];
		var chk = create_checkbox( chkname, arr[i], true );
		cell1.appendChild( chk );

		ret.push( chkname );
	}

	return ret;
}

// ---------
/**	@brief	Apply filter and sort
 */
function apply_filters()
{
	// ---
	// Store rules to 'filtering_rule'

	filtering_rule.filter = {};
	filtering_rule.sort = [];

	// Filter
	for( var i = 0; i < chk_filter.length; ++i )
	{
		var	chk = document.getElementById( chk_filter[i] );
		if( chk_filter[i] == 'chk_misc_詳細表示' )
		{
			filtering_rule.show_detail = chk.checked;
			continue;
		}

		var	name = chk_filter[i].split('_');
		if( typeof filtering_rule.filter[name[1]] != 'object' )
			filtering_rule.filter[name[1]] = []
		if( chk.checked )
		{
			filtering_rule.filter[name[1]].push( name[2] );
		}
	}

	// Sort
	for( var i = 0; i < sel_sort.length; ++i )
	{
		var	sel0 = document.getElementById( sel_sort[i][0] );
		if( sel0.selectedIndex > 0 )
		{
			var	sel1 = document.getElementById( sel_sort[i][1] );
			filtering_rule.sort.push( [sel0.selectedIndex, sel1.selectedIndex] );
		}
		else
		{
			filtering_rule.sort.push( null );
		}
	}

	updateMSList( false );
}

// ---------
/**	@brief	Check whether record is showing
 */
function filter_ms(record)
{
	for( var key in filtering_rule.filter )
	{
		var	vals = filtering_rule.filter[key];
		if( key == 'stage' )
		{
			var	valid = false;
			for( var i = 0; i < vals.length; ++i )
			{
				var	colname = '';
				switch( vals[i] )
				{
				case '地上':
					colname = 'ground';
					break;

				case '宇宙':
					colname = 'space';
					break;

				default:
					break;
				}
				var	idx = db_ms.searchColumn( colname );
				if( idx >= 0 )
				{
					if( record[idx] == '○' )
					{
						valid = true;
						break;
					}
				}
			}
			if( !valid )
				return false;
		}
		else if( key == 'compati' )
		{
			var	idx = db_ms.searchColumn( 'compatibility' );
			var	valid = false;
			for( var i = 0; (i < vals.length) && !valid; ++i )
			{
				switch( vals[i] )
				{
				case '地上適正あり':
					if( record[idx] == '地上' )
						valid = true;
					break;

				case '地上適正なし':
					if( record[idx] != '地上' )
						valid = true;
					break;

				case '宇宙適正あり':
					if( record[idx] == '宇宙' )
						valid = true;
					break;

				case '宇宙適正なし':
					if( record[idx] != '宇宙' )
						valid = true;
					break;

				default:
					break;
				}
			}
			if( !valid )
				return false;
		}
		else if( key == 'skill' )
		{
			var	idx = db_ms.searchColumn( 'skills' );
			var	skills = record[idx];
			var	valid = false;
			for( var i = 0; i < vals.length; ++i )
			{
				if( skills.indexOf(vals[i]) >= 0 )
				{
					valid = true;
					break;
				}
			}
			if( !valid )
				return false;
		}
		else
		{
			var	idx = db_ms.searchColumn( key );
			if( idx >= 0 )
			{
				if( vals.findIndex(function(n){return n == record[idx];}) < 0 )
					return false;
			}
		}
	}
	return true;
}

// ---------
/**	@brief	Update MS list
 */
function updateMSList(update_filter)
{
	if( !db_ms || !db_weapon1 || !db_weapon2 || !db_skill )
		return;		// DBs are not ready

	// ---
	if( update_filter )
	{
		var	elem_filter = document.getElementById('filter');
		elem_filter.innerHTML = '';

		var	div_filter_sort_button = document.createElement('div');
		if( div_filter_sort_button )
		{
			div_filter_sort_button.style.textAlign = 'right';

			var btn_apply = document.createElement('button');
			btn_apply.style.width = '80px';
			btn_apply.textContent = '適用';
			btn_apply.onclick = apply_filters;
			div_filter_sort_button.appendChild( btn_apply );

			elem_filter.appendChild( div_filter_sort_button );
		}

		// ---
		// Filter

		var	tbl_filter = document.createElement("table");

		var	head_filter_row = tbl_filter.insertRow(-1);
		var head_filter_cell = document.createElement( 'th' );
		head_filter_cell.colSpan = '2';
		head_filter_cell.innerHTML = 'フィルタ';
		head_filter_row.appendChild( head_filter_cell );

		// Parameters
		chk_filter = []
		for( var i = 0; i < FILTER_PARAM.length; ++i )
		{
			var keyname = FILTER_PARAM[i];
			var arr = db_ms.distinct( keyname );
			arr.sort();
			chk_filter = chk_filter.concat( add_filter(tbl_filter, PARAM_NAME[keyname], keyname, arr) );
		}
		chk_filter = chk_filter.concat( add_filter(tbl_filter, '出撃制限', 'stage', ['地上', '宇宙']) );
		chk_filter = chk_filter.concat( add_filter(tbl_filter, '適正', 'compati', ['地上適正あり', '地上適正なし', '宇宙適正あり', '宇宙適正なし']) );

		// Skill
		var arr_skill0 = db_skill.distinct( 'name' );
		var arr_skill1 = [];
		for( var i = 0; i < arr_skill0.length; ++i )
		{
			var	name = arr_skill0[i].slice(0, -3);
			if( arr_skill1.findIndex(function(n){return n == name;}) < 0 )
			arr_skill1.push( name );
		}
		arr_skill1.sort();
		chk_filter = chk_filter.concat( add_filter(tbl_filter, 'スキル', 'skill', arr_skill1) );

		// misc
		chk_filter = chk_filter.concat( add_filter(tbl_filter, 'その他', 'misc', ['詳細表示']) );

		elem_filter.appendChild( tbl_filter );

		var	div_filter_button = document.createElement('div');
		if( div_filter_button )
		{
			div_filter_button.style.textAlign = 'right';

			var btn_clear = document.createElement('button');
			btn_clear.style.width = '60px';
			btn_clear.textContent = '全解除';
			btn_clear.onclick = function()
				{
					for( var i = 0; i < chk_filter.length; ++i )
					{
						var	chk = document.getElementById( chk_filter[i] );
						chk.checked = false;
					}
				};
			div_filter_button.appendChild( btn_clear );

			var btn_selectall = document.createElement('button');
			btn_selectall.style.width = '60px';
			btn_selectall.textContent = '全選択';
			btn_selectall.onclick = function()
				{
					for( var i = 0; i < chk_filter.length; ++i )
					{
						var	chk = document.getElementById( chk_filter[i] );
						chk.checked = true;
					}
				};
			div_filter_button.appendChild( btn_selectall );

			elem_filter.appendChild( div_filter_button );
		}

		// ---
		// Sort

		var	tbl_sort = document.createElement("table");

		var	head_sort_row = tbl_sort.insertRow(-1);
		var head_sort_cell = document.createElement( 'th' );
		head_sort_cell.colSpan = '3';
		head_sort_cell.innerHTML = 'ソート';
		head_sort_row.appendChild( head_sort_cell );

		sel_sort = [];
		var sort_arr = ['なし'];
		for( var i = 0; i < SORT_PARAM.length; ++i )
			sort_arr.push( PARAM_NAME[ SORT_PARAM[i] ] );
		for( var i = 0; i < 6; ++i )
		{
			var	row = tbl_sort.insertRow(-1);

			var	cell0 = row.insertCell(-1);
			cell0.style.width = '100px';
			cell0.style.textAlign = 'right';
			cell0.style.fontSize = 'small';
			cell0.innerHTML = '' + (i + 1);

			var name_item0 = 'sort' + i;
			var	div_item0 = create_pulldown( name_item0, sort_arr, 0 );
			var	cell1 = row.insertCell(-1);
			cell1.style.width = '100px';
			cell1.appendChild( div_item0 );

			var name_item1 = 'sort' + i + '_type';
			var	div_item1 = create_pulldown( name_item1, SORT_TYPE, 0 );
			var	cell2 = row.insertCell(-1);
			cell2.appendChild( div_item1 );

			sel_sort.push( [name_item0, name_item1] );
		}

		elem_filter.appendChild( tbl_sort );
	}

	// ---
	// List

	if( !filtering_rule.enable_columns )
	{
		filtering_rule.enable_columns = db_ms.columns.concat();
		filtering_rule.enable_columns.shift();	// To remove 'id' column
	}

	// Filtering with user's rules
	var	db = db_ms.filter( filter_ms );

	// Sort with user's rules
	if( filtering_rule.require_sort() )
	{
		db = db.sort( function(rec0, rec1)
			{
				for( var i = 0; i < filtering_rule.sort.length; ++i )
				{
					if( !filtering_rule.sort[i] )
						continue;
					var	type = filtering_rule.sort[i][0];
					var	less = -1;
					if( filtering_rule.sort[i][1] )
						less = 1;
					if( type == 0 )
					{	// None
					}
					else
					{
						var	idx = db_ms.searchColumn( SORT_PARAM[type - 1] );
						if( rec0[idx] < rec1[idx] )
							return less;
						else if( rec0[idx] > rec1[idx] )
							return - less;
					}
				}
				return 0;
			} );
	}

	// Prepare column indeces
	var	cidx0 = []
	var	cidx1 = []
	for( var i = 0; i < filtering_rule.enable_columns.length; ++i )
	{
		var	name = filtering_rule.enable_columns[i];
		var	idx = db.searchColumn( name );

		if( name == 'main_weapon1' || name == 'main_weapon2' || name == 'sub_weapon' || name == 'skills' )
			cidx1.push( idx );
		else
			cidx0.push( idx );
	}
	var idx_type = db.searchColumn( 'type' );
	var idx_skills = db.searchColumn( 'skills' );

	// Create table
	var PERIOD_HEADER = 15;
	var count = PERIOD_HEADER;
	var	tbl = document.createElement("table");
	for( var i = 0; i < db.getRecordNum(); ++i )
	{
		var	bgcol = 'generalbg';
		if( db.raw[i][idx_type] == '強襲' )
			bgcol = 'raidbg';
		else if( db.raw[i][idx_type] == '支援' )
			bgcol = 'supportbg';

		// Header
		if( filtering_rule.show_detail || count >= PERIOD_HEADER )
		{
			var	row_head = tbl.insertRow(-1);
			for( var j = 0; j < cidx0.length; ++j )
			{
				var	text = db.columns[cidx0[j]];

				var cell = document.createElement( 'th' );
				cell.innerHTML = PARAM_NAME[text];
				row_head.appendChild( cell );
			}
			count = 0;
		}

		// Parameters - line 1
		var row = tbl.insertRow(-1);
		for( var j = 0; j < cidx0.length; ++j )
		{
			var	cell = row.insertCell(-1);

			var	text = db.raw[i][cidx0[j]];
			if( typeof text == 'string' )
			{
				text = text.replace( /\n/g, '<br>' );
				if( j != 0 )
					cell.style.textAlign = 'center'
			}
			else if( typeof text == 'number' )
			{
				cell.style.textAlign = 'right'
			}

			cell.innerHTML = text;
			if( j == 0 )
				cell.className = bgcol;
		}

		// Parameters - line 2
		if( filtering_rule.show_detail && cidx1.length > 0 )
		{
			var	first_span = 1;
			var	span = Math.floor((cidx0.length - first_span) / (cidx1.length - 1));
			var	num = 0;
			row = tbl.insertRow(-1);
			for( var j = 0; j < cidx1.length; ++j )
			{
				var	text = db.raw[i][cidx1[j]];
				if( cidx1[j] == idx_skills )
				{
					var	skills = text.split( '\n' )
					text = '<table border=0 width="100%">'
					for( var k = 0; k < skills.length; ++k )
					{
						text += '<tr><td class="skill_la">' + skills[k].slice(0, -3) + '</td>';
						text += '<td class="skill_ra">' + skills[k].slice(-3) + '</td></tr>';
					}
					text += '</table>';
				}
				else if( typeof text == 'string' )
				{
					text = text.replace( /\n/g, '<br>' );
				}

				var	cell = row.insertCell(-1);
				cell.style.fontSize = 'small';
				cell.innerHTML = text;
				if( j == 0 )
				{
					cell.colSpan = '' + first_span;
					num += first_span;
				}
				else if( j == cidx1.length - 1 )
				{
					cell.colSpan = '' + (cidx0.length - num);
				}
				else
				{
					cell.colSpan = '' + span;
					num += span;
				}
			}
		}

		++count;
	}

	var	elem = document.getElementById('list');
	elem.innerHTML = '';
	elem.appendChild( tbl );
}

// ---------
/**	@brief	Startup process
 */
function init()
{
	var	recv_ms = function(x) { db_ms = csv_to_db(x); init_ms_db(); updateMSList(true); }
	var	recv_weapon1 = function(x) { db_weapon1 = csv_to_db(x); updateMSList(true); }
	var	recv_weapon2 = function(x) { db_weapon2 = csv_to_db(x); updateMSList(true); }
	var	recv_skill = function(x) { db_skill = csv_to_db(x); updateMSList(true); }
	read_file( "db/btlop2_MS.csv", recv_ms );
	read_file( "db/btlop2_Weapon1.csv", recv_weapon1 );
	read_file( "db/btlop2_Weapon2.csv", recv_weapon2 );
	read_file( "db/btlop2_Skill.csv", recv_skill );
}
