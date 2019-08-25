/*
 * Copyright 2019 ratty27
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

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
	"thruster": "ｽﾗｽﾀｰ",
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
	"skills": "スキル",
	"melee_power": "格闘判定",
	"eval": "評価"
}

var FILTER_PARAM = ['cost', 'type', 'level', 'rarity', 'melee_power'];
var SORT_PARAM = ['name', 'cost', 'type', 'level', 'rarity', "eval", 'melee_power'];
var SORT_TYPE = ['昇順', '降順'];
var EVAL_PARAM = ['Ｓ', 'Ａ', 'Ｂ', 'Ｃ', 'Ｄ', 'Ｅ'];
var MELEE_POWER_PARAM = ['弱', '中', '強'];

var	DEFAULT_EVALUATION = 5;

var KEYNAME_PRESET_LIST = '__btlop2db_preset_list__';
var KEYNAME_USER_EVAL = '__btlop2db_user_eval__';

// ---------
// Variables
var	db_ms = null;
var	db_weapon1 = null;
var	db_weapon2 = null;
var db_subweapon = null;
var	db_skill = null;
var chk_filter = null;
var sel_sort = null;
var	args = {}

// ---------
/*	Filtering rule class
 */

//!	@brief	Constructor
var FilteringRule = function()
{
	this.enable_columns = null;
	this.filter = {};
	this.sort = [];
	this.show_detail = false;
}

	//!	@brief	Store from oject
FilteringRule.prototype.store_obj = function(obj)
{
	this.enable_columns = obj.enable_columns;
	this.filter = obj.filter;
	this.sort = obj.sort;
	this.show_detail = obj.show_detail;
}

	//!	@brief	Check whether sorting is required
FilteringRule.prototype.require_sort = function()
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
	var	idx_melee_power = db_ms.searchColumn( 'melee_power' );
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

		var	mpower = db_ms.raw[i][idx_melee_power];
		if( mpower == 'strong' )
			db_ms.raw[i][idx_melee_power] = '強';
		else if( mpower == 'normal' )
			db_ms.raw[i][idx_melee_power] = '中';
		else if( mpower == 'weak' )
			db_ms.raw[i][idx_melee_power] = '弱';
	}

	// Add user's evaluation column
	db_ms.addColumn( 'eval', DEFAULT_EVALUATION );
	if( 'e' in args )
		decode_share_url( args['e'] );
	else
		load_evaluation();
}

// ---------
/**	@brief	Get weapon parameter at text
 */
function get_weapon_param( db, name, level, body )
{
	if( body )
		db = db.filter( 'body', body );
	db = db.filter( 'name', name );
	if( !db )
		return 'no data';
	if( db.getRecordNum() == 0 )
		return 'no data';

	var	rec;
	var	idx_level = db.searchColumn( 'level' );
	if( idx_level >= 0 && db.getRecordNum() > 1 )
	{
		db = db.sort( idx_level );
		var	idx = 0;
		for( var i = 1; i < db.getRecordNum(); ++i )
		{
			if( db.raw[i][idx_level] > level )
			{
				break;
			}
			else if( db.raw[i][idx_level] == level )
			{
				idx = i;
				break;
			}
			else if( db.raw[i][idx_level] > db.raw[idx][idx_level] )
			{
				idx = i;
			}
		}
		rec = db.raw[idx];
	}
	else
	{
		rec = db.raw[0];
	}

	var	idx_type = db.searchColumn( 'type' );
	var	type;
	if( idx_type < 0 )
		type = 'melee';
	else
		type = rec[idx_type];
	if( type == 'other' )
	{	// Note: Overwrite 'type' for displaying.
		//       Don't show this 'type' directly, that is not correct.
		if( name.indexOf('グレネード') >= 0
		 || name.indexOf('クナイ') >= 0
		 || name.indexOf('ハイドボンブ') >= 0
		 || name.indexOf('クラッカー') >= 0
		 || name.indexOf('ポッド') >= 0
		 || name.indexOf('閃光弾') >= 0
		 || name.indexOf('ミサイル') >= 0
		 || name.indexOf('爆雷') >= 0 )
		{
			type = 'ammo';
		}
		else if( name.indexOf('ビーム') >= 0 )
		{
			type = 'beam';
		}
	}

	var	idx_power = db.searchColumn( 'power' );
	var	idx_range = db.searchColumn( 'range' );
	var	idx_limit = db.searchColumn( 'ammo/heat_rate' );

	var	ret;
	if( type == 'beam' )
	{
		ret =  '威力: ' + rec[idx_power] + '\n';
		ret += '射程距離: ' + rec[idx_range] + '\n';
		ret += 'ヒート率: ' + rec[idx_limit];
	}
	else if( type == 'ammo' )
	{
		ret =  '威力: ' + rec[idx_power] + '\n';
		ret += '射程距離: ' + rec[idx_range] + '\n';
		ret += '弾数: ' + rec[idx_limit];
	}
	else if( type == 'melee' )
	{
		ret =  '威力: ' + rec[idx_power];
	}
	else if( type == 'shield' )
	{
		ret =  'ＨＰ: ' + rec[idx_power] + "\n";
		ret += 'サイズ: ' + rec[idx_range];
	}
	else
	{
		ret = 'no data';
	}
	return ret;
}

// ---------
/**	@brief	Create displaying item for weapon
 */
function create_disp_weapon( db, name, level, body )
{
	return '<span title="' + get_weapon_param(db, name, level, body) + '">' + name + '</span>';
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
//	if( BROWSER_TYPE == BROWSER_TYPE_IE || BROWSER_TYPE == BROWSER_TYPE_EDGE )
	{	// Arrange by internal tabe manually, because IE and Edge can't arrange buttons in flex.
		var	maxcols;
		if( name == 'スキル' )
			maxcols = 5;
		else
			maxcols = arr.length;

		var	intbl = document.createElement( 'table' );
		intbl.style.width = 'auto';
		intbl.style.boxShadow = 'none';
		var	inrow = null;
		var	colnum = 0;
		for( var i = 0; i < arr.length; ++i )
		{
			if( arr[i] == '' )
				continue;

			if( !inrow )
				inrow = intbl.insertRow( -1 );

			var chkname = 'chk_' + id_ + '_' + arr[i];
			var chk = create_checkbox( chkname, arr[i], true );
			ret.push( chkname );

			var	incel = inrow.insertCell( -1 );
			incel.style.border = 'none';
			incel.appendChild( chk );

			colnum += 1;
			if( colnum >= maxcols )
			{
				inrow = null;
				colnum = 0;
			}
		}
		cell1.appendChild( intbl );
	}
/*	else
	{
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
	}*/

	return ret;
}

// ---------
/**	@brief	Split check-box label
 */
function split_chk_label( label )
{
	var	pos0 = label.indexOf( '_' );
	var	pos1 = label.lastIndexOf( '_' );
	if( pos0 == pos1 )
	{	// error
		return null;
	}

	return [
		label.substring( 0, pos0 ),
		label.substring( pos0 + 1, pos1 ),
		label.substring( pos1 + 1, label.length )
	];
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
	var	availables = {};
	for( var i = 0; i < chk_filter.length; ++i )
	{
		var	chk = document.getElementById( chk_filter[i] );
		if( chk_filter[i] == 'chk_misc_詳細表示' )
		{
			filtering_rule.show_detail = chk.checked;
			continue;
		}

		var	name = split_chk_label( chk_filter[i] );
		var	type = name[1];
		if( !(type in filtering_rule.filter) )
		{
			filtering_rule.filter[type] = []
			availables[type] = false;
		}
		if( chk.checked )
			filtering_rule.filter[type].push( name[2] );
		else
			availables[type] = true;
	}
	// Delete filter type if all items are checked in a category
	console.log( "---" );
	for( var type in availables )
	{
		if( !availables[type] )
			delete filtering_rule.filter[type];
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
			var	skills = record[idx].split( '\n' );
			var	valid = false;
			for( var i = 0; !valid && (i < vals.length); ++i )
			{
				for( var j = 0; j < skills.length; ++j )
				{
					if( skills[j].startsWith(vals[i]) )
					{
						valid = true;
						break;
					}
				}
			}
			if( !valid )
				return false;
		}
		else if( key == 'eval' )
		{
			var	idx = db_ms.searchColumn( 'eval' );
			if( idx >= 0 )
			{
				if( vals.findIndex(function(n){return n == EVAL_PARAM[record[idx]];}) < 0 )
					return false;
			}
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
/**	@brief	Change evaluation event
 */
function event_change_eval(item)
{
	var	id_ = item.id.split('_');
	var	idx = db_ms.findIndex( 'id', Number(id_[1]) );
	if( idx >= 0 )
	{
		var idx_eval = db_ms.searchColumn( 'eval' );
		db_ms.raw[idx][idx_eval] = item.selectedIndex;
	}
	update_share_url();
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
		head_filter_cell.style.textAlign = 'left';
		head_filter_cell.style.fontSize = 'small';
		head_filter_row.appendChild( head_filter_cell );

		// Parameters
		chk_filter = []
		for( var i = 0; i < FILTER_PARAM.length; ++i )
		{
			var keyname = FILTER_PARAM[i];
			var arr;
			if( keyname == 'melee_power' )
			{	// Kanji can't be sorted
				arr = MELEE_POWER_PARAM;
			}
			else
			{
				arr = db_ms.distinct( keyname );
				arr.sort();
			}
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

		// Evaluation
		chk_filter = chk_filter.concat( add_filter(tbl_filter, '評価', 'eval', EVAL_PARAM) );

		// misc
		chk_filter = chk_filter.concat( add_filter(tbl_filter, 'その他', 'misc', ['詳細表示']) );

		elem_filter.appendChild( tbl_filter );

		var	div_filter_button = document.createElement('div');
		if( div_filter_button )
		{
			div_filter_button.style.textAlign = 'right';

			var btn_clear = document.createElement('button');
			btn_clear.style.width = '80px';
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
			btn_selectall.style.width = '80px';
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
		head_sort_cell.style.textAlign = 'left';
		head_sort_cell.style.fontSize = 'small';
		head_sort_row.appendChild( head_sort_cell );

		sel_sort = [];
		var sort_arr = ['なし'];
		for( var i = 0; i < SORT_PARAM.length; ++i )
			sort_arr.push( PARAM_NAME[ SORT_PARAM[i] ] );
		for( var i = 0; i < SORT_PARAM.length; ++i )
		{
			var	row = tbl_sort.insertRow(-1);

			var	cell0 = row.insertCell(-1);
			cell0.style.width = '100px';
			cell0.style.textAlign = 'right';
			cell0.style.fontSize = 'small';
			cell0.innerHTML = '' + (i + 1);

			var name_item0 = 'sort' + i;
			var	div_item0 = create_pulldown( name_item0, sort_arr, 0, 100 );
			var	cell1 = row.insertCell(-1);
			cell1.style.width = '100px';
			cell1.innerHTML = div_item0;

			var name_item1 = 'sort' + i + '_type';
			var	div_item1 = create_pulldown( name_item1, SORT_TYPE, 0, 100 );
			var	cell2 = row.insertCell(-1);
			cell2.innerHTML = div_item1;

			sel_sort.push( [name_item0, name_item1] );
		}

		elem_filter.appendChild( tbl_sort );
	}

	restore_filter_parameters();

	// ---
	// List

	if( !filtering_rule.enable_columns )
	{
		// Set default showing columns
		filtering_rule.enable_columns = db_ms.columns.concat([]);
		filtering_rule.enable_columns = filtering_rule.enable_columns.filter( 
			function(n)
			{
				return n != 'id' && n != 'eval';
			}
		);
	}

	// Filtering with user's rules
	var	db = db_ms.filter( filter_ms );

	// Sort with user's rules
//	if( filtering_rule.require_sort() )
	{
		db = db.sort( function(rec0, rec1)
			{
				var	sorted_by_name = false;
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
						if( type == 7 )
						{	// Melee power
							var	n0 = MELEE_POWER_PARAM.findIndex( function(x){return x == rec0[idx];} );
							var	n1 = MELEE_POWER_PARAM.findIndex( function(x){return x == rec1[idx];} );
							if( n0 < n1 )
								return less;
							else if( n0 > n1 )
								return - less;
						}
						else
						{
							if( type == 6 )		// Evaluaion value
								less = - less;
							if( rec0[idx] < rec1[idx] )
								return less;
							else if( rec0[idx] > rec1[idx] )
								return - less;
						}
						if( SORT_PARAM[type - 1] == 'name' )
							sorted_by_name = true;
					}
				}
				if( !sorted_by_name )
				{
					var	idx = db_ms.searchColumn( 'name' );
					if( rec0[idx] < rec1[idx] )
						return -1;
					else if( rec0[idx] > rec1[idx] )
						return 1;
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
	var idx_id = db.searchColumn( 'id' );
	var idx_level = db.searchColumn( 'level' );
	var idx_name = db.searchColumn( 'name' );
	var idx_type = db.searchColumn( 'type' );
	var idx_weapon1 = db.searchColumn( 'main_weapon1' );
	var idx_weapon2 = db.searchColumn( 'main_weapon2' );
	var idx_subweapon = db.searchColumn( 'sub_weapon' );
	var idx_skills = db.searchColumn( 'skills' );
	var idx_eval = db.searchColumn( 'eval' );
	var idx_weapon1_sub = db_weapon1.searchColumn( 'sub_weapon' );

	// Create table
	var PERIOD_HEADER = 15;
	var count = PERIOD_HEADER;
	var	tbl = "<table>";
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
			tbl += '<tr>';
			tbl += '<th>評価</th>';

			for( var j = 0; j < cidx0.length; ++j )
			{
				var	text = db.columns[cidx0[j]];
				tbl += '<th>' + PARAM_NAME[text] + '</th>';
			}
			count = 0;

			tbl += '</tr>';
		}

		// Parameters - line 1
		tbl += '<tr>';
		{	// User's evaluation
			var	sel = create_pulldown( 'eval_' + db.raw[i][idx_id], EVAL_PARAM, db.raw[i][idx_eval], 40, "event_change_eval" );

			tbl += '<td>' + sel + '</td>';
		}
		for( var j = 0; j < cidx0.length; ++j )
		{
			var	text = db.raw[i][cidx0[j]];
			var	attr = '';
			var	style = '';
			if( typeof text == 'string' )
			{
				if( cidx0[j] == idx_name )
					text = text.replace( /\n/g, ' ' );
				else
					text = text.replace( /\n/g, '<br>' );
				if( j != 0 )
					style += 'text-align: center;';
			}
			else if( typeof text == 'number' )
			{
				style += ' text-align: right;';
			}

			if( j == 0 )
				attr += ' class="' + bgcol + '"';

			if( style.length > 0 )
				attr += ' style="' + style.trim() + '"';

			tbl += '<td' + attr + '>' + text + '</td>';
		}
		tbl += '</tr>';

		// Parameters - line 2
		var	first_span = 2;
		var line1_columns = cidx0.length + 1;
		var	span = Math.floor((line1_columns - first_span) / (cidx1.length - 1));
		var	withsub = [];
		if( filtering_rule.show_detail && cidx1.length > 0 )
		{
			var idx_exp = db_skill.searchColumn( 'explanation' );
			var	num = 0;
			tbl += '<tr>';
			for( var j = 0; j < cidx1.length; ++j )
			{
				var	text = db.raw[i][cidx1[j]];
				if( cidx1[j] == idx_weapon1 )
				{
					var	weapons = text.split( '\n' );
					var	single = [];
					for( var k = 0; k < weapons.length; ++k )
					{
						var weapon_name = weapons[k];
						if( weapon_name == '' )
							continue;
						var	weapon_idx = db_weapon1.findIndex( 'name', weapon_name );
						if( weapon_idx >= 0 )
						{
							var	sub_weapon = db_weapon1.raw[weapon_idx][idx_weapon1_sub];
							if( sub_weapon != '' )
							{
								withsub.push( [weapon_name, sub_weapon] );
								continue;
							}
						}
						single.push( create_disp_weapon(db_weapon1, weapon_name, db.raw[i][idx_level]) );
					}
					text = single.join( '<br>' );
				}
				else if( cidx1[j] == idx_skills )
				{
					var	skills = text.split( '\n' )
					text = '<table border=0 width="100%" style="box-shadow: none;">'
					for( var k = 0; k < skills.length; ++k )
					{
						if( skills[k] == '' )
							continue;
						var tips_idx = db_skill.findIndex( 'name', skills[k] );
						var	tips;
						if( tips_idx < 0 )
						{
							console.error( 'Error: "' + skills[k] + '" is not found' );
							tips = '';
						}
						else
						{
							tips = db_skill.raw[tips_idx][idx_exp];
						}
						text += '<tr><td class="skill_la"><span title="' + tips + '">' + skills[k].slice(0, -3) + '</span></td>';
						text += '<td class="skill_ra">' + skills[k].slice(-3) + '</td></tr>';
					}
					text += '</table>';
				}
				else if( typeof text == 'string' )
				{
					//text = text.replace( /\n/g, '<br>' );
					var	weapons = text.split( '\n' );
					var	out = [];
					for( var k = 0; k < weapons.length; ++k )
					{
						var	item;
						if( cidx1[j] == idx_weapon2 )
							item = create_disp_weapon( db_weapon2, weapons[k], db.raw[i][idx_level] );
						else if( cidx1[j] == idx_subweapon )
							item = create_disp_weapon( db_subweapon, weapons[k], db.raw[i][idx_level], db.raw[i][idx_name] );
						else
							item = weapons[k];
						out.push( item );
					}
					text = out.join( '<br>' );
				}

				var	attr = '';
				if( j == 0 )
				{
					attr += ' colspan="' + first_span +'"';
					num += first_span;
				}
				else if( j == cidx1.length - 1 )
				{
					var	colspan = line1_columns - num;
					attr += ' colspan="' + colspan +'"';
				}
				else
				{
					attr += ' colspan="' + span +'"';
					num += span;
				}
				if( (cidx1[j] == idx_weapon2 || cidx1[j] == idx_skills) && withsub.length > 0 )
				{
					var	num = withsub.length + 1;
					attr += ' rowspan="' + num +'"';
				}
				tbl += '<td style="font-size: small"' + attr + '>' + text + '</td>';
			}
			tbl += '</tr>';
		}

		// Parameters - line 3
		if( withsub.length > 0 )
		{
			var	num = 0;
			for( var k = 0; k < withsub.length; ++k )
			{
				tbl += '<tr>';
				for( var j = 0; j < cidx1.length; ++j )
				{
					if( cidx1[j] == idx_weapon2 )
						continue;

					var	colspan;
					if( j == 0 )
					{
						colspan = first_span;
						num += first_span;
					}
					else if( j == cidx1.length - 1 )
					{
						colspan = line1_columns - num;
					}
					else
					{
						colspan = span;
						num += span;
					}

					tbl += '<td colspan="' + colspan + '" style="font-size: small">';
					if( cidx1[j] == idx_weapon1 )
						tbl += create_disp_weapon( db_weapon1, withsub[k][0], db.raw[i][idx_level] );
					else if( cidx1[j] == idx_subweapon )
						tbl += create_disp_weapon( db_subweapon, withsub[k][1], db.raw[i][idx_level], withsub[k][0] );
					tbl += '</td>';
				}
				tbl += '</tr>';
			}
		}

		++count;
	}
	tbl += '</table>';

	// Append to document
	var	elem = document.getElementById('list');
	elem.innerHTML = '';

	var	div_eval = document.createElement( 'div' );
	div_eval.id = 'div_eval';

	// - save eval button
	var btn_save_eval = document.createElement('button');
	btn_save_eval.style.width = '200px';
	btn_save_eval.style.cssFloat = 'left';
	btn_save_eval.textContent = '変更した評価を保存する';
	btn_save_eval.onclick = save_evaluation;
	div_eval.appendChild( btn_save_eval );

	var	url_div = document.createElement( 'div' );
	url_div.id = 'url_div';
	url_div.style.width = '100%';
	url_div.style.textAlign = 'right';
	div_eval.appendChild( url_div );

	// - URL label
	var rl_exp = 'このURLをコピペすれば、あなたの評価設定を他の人に見て\nもらうことが出来ます。\nこのURLを開いても、その相手が「変更した評価を保存する」\nボタンを押さない限り、相手の評価データが破壊されることは\nありません。';
	var url_label = document.createElement( 'span' );
	url_label.innerText = '共有用URL:';
	url_label.title = rl_exp;
	url_div.appendChild( url_label );

	// - URL
	var url_text = document.createElement( 'input' );
	url_text.id = 'share_url';
	url_text.type = 'text';
	url_text.style.width = '512px';
//	url_text.readOnly = true;
	url_label.appendChild( url_text );

	// - Copy button
	var btn_copy = document.createElement( 'button' );
	btn_copy.style.width = '60px';
	btn_copy.style.fontSize = 'x-small';
	btn_copy.textContent = 'コピー';
	btn_copy.onclick = function()
		{
			var	elem = document.getElementById( 'share_url' );
			elem.select();
			document.execCommand( 'copy' );
		};
	url_div.appendChild( btn_copy );

	div_eval.appendChild( url_div );
	elem.appendChild( div_eval );

	// - MS list
	var	div_tbl = document.createElement( 'div' );
	div_tbl.innerHTML = tbl;
	elem.appendChild( div_tbl );

	// - save eval button
	var btn_save_eval2 = btn_save_eval.cloneNode( true );
	btn_save_eval2.onclick = save_evaluation;
	elem.appendChild( btn_save_eval2 );


	// ---
	// Update share URL
	update_share_url();
}

// ---------
/**	@brief	Startup process
 */
function init()
{
	var	params = '' + location.search;
	if( params.startsWith('?') )
	{
		params = params.substring(1).split('&');
		for( var i = 0; i < params.length; i++ )
		{
			if( params[i] == '' )
				continue;
			var val = params[i].split('=');
			if( val.length == 2 )
				args[ val[0] ] = val[1];
		}
	}

	var	recv_ms = function(x)        { db_ms = csv_to_db(x);        db_ms.sort('id'); init_ms_db(); updateMSList(true); }
	var	recv_weapon1 = function(x)   { db_weapon1 = csv_to_db(x);   db_weapon1.sort('name');        updateMSList(true); }
	var	recv_weapon2 = function(x)   { db_weapon2 = csv_to_db(x);   db_weapon2.sort('name');        updateMSList(true); }
	var	recv_subweapon = function(x) { db_subweapon = csv_to_db(x); db_subweapon.sort('body');      updateMSList(true); }
	var	recv_skill = function(x)   { db_skill = csv_to_db(x);       db_skill.sort('name');          updateMSList(true); }
	read_file( "db/btlop2_MS.csv?v=e1d78161001276a870b89406c500855808adf09f", recv_ms );
	read_file( "db/btlop2_Weapon1.csv?v=25b2ba37d6bec1ca23cc5b71551b0813f1c3a4fb", recv_weapon1 );
	read_file( "db/btlop2_Weapon2.csv?v=98f3ff86de6c1ce97375048bb2daa02ec1f6f1b8", recv_weapon2 );
	read_file( "db/btlop2_SubWeapon.csv?v=f2e9eddbaf8659903e675927a530c656574b8f9d", recv_subweapon );
	read_file( "db/btlop2_Skill.csv?v=2b0f1f14aaae8dc73c221cdc5f310adaf6fcce4a", recv_skill );

	document.getElementById('btlop2dbtitle').href = get_current_url();

	update_preset_list();
}

// ---------
/**	@brief	Load preset list from local storage
 */
function load_preset_list()
{
	var	json = localStorage.getItem( KEYNAME_PRESET_LIST );
	if( json )
		return JSON.parse( json );
	else
		return [];
}

// ---------
/**	@brief	Store preset list to local storage
 */
function store_preset_list(list)
{
	var json = JSON.stringify( list );
	localStorage.setItem( KEYNAME_PRESET_LIST, json );
}

// ---------
/**	@brief	Update preset pulldown list
 */
function update_preset_list()
{
	var	presets = load_preset_list();

	var	pulldown = document.getElementById( 'preset_list' );
	pulldown.innerHTML = '';
	for( var i = 0; i < presets.length; ++i )
	{
		var	item = document.createElement( 'option' );
		item.value = presets[i];
		pulldown.appendChild( item );
	}
}

// ---------
/**	@brief	Load current rules from preset
 */
function load_preset()
{
	var	elem = document.getElementById( 'preset_name' );
	var	name = elem.value.trim();
	if( name == "" )
		return;

	var	json = localStorage.getItem( name );
	if( json )
	{
		var	rule = JSON.parse( json );
		filtering_rule.store_obj( rule );
		updateMSList(true);
		restore_filter_parameters();
	}
}

// ---------
/**	@brief	Save current rules as preset
 */
function save_preset()
{
	var	elem = document.getElementById( 'preset_name' );
	var	name = elem.value.trim();
	if( name == "" )
	{
		alert( 'プリセット名を入力してください。' );
		return;
	}

	apply_filters();

	var	json = JSON.stringify( filtering_rule );
	localStorage.setItem( name, json );

	var presets = load_preset_list();
	if( presets.findIndex(function(n){return n == name;}) < 0 )
		presets.push( name );
	store_preset_list( presets );

	update_preset_list();

//	alert( name + "\nを保存しました。" );
}

// ---------
/**	@brief	Restore rule parameters to form
 */
function restore_filter_parameters()
{
	if( Object.keys(filtering_rule.filter).length > 0 )
	{
		for( var i = 0; i < chk_filter.length; ++i )
		{
			var	flag = true;

			var	name = split_chk_label( chk_filter[i] );
			if( name[1] in filtering_rule.filter )
			{
				var	vals = filtering_rule.filter[ name[1] ];
				if( vals.findIndex(function(n){return n == name[2];}) < 0 )
					flag = false;
			}

			var	chk = document.getElementById( chk_filter[i] );
			chk.checked = flag;
		}
	}

	var	idx_sort = 0;
	if( filtering_rule.sort.length > 0 )
	{
		var	num = Math.min( filtering_rule.sort.length, sel_sort.length );
		for( ; idx_sort < num; ++idx_sort )
		{
			var	elem0 = document.getElementById( sel_sort[idx_sort][0] );
			var	elem1 = document.getElementById( sel_sort[idx_sort][1] );
			if( filtering_rule.sort[idx_sort] )
			{
				elem0.selectedIndex = filtering_rule.sort[idx_sort][0];
				elem1.selectedIndex = filtering_rule.sort[idx_sort][1];
			}
			else
			{
				elem0.selectedIndex = 0;
				elem1.selectedIndex = 0;
			}
		}
	}
	for( ; idx_sort < sel_sort.length; ++idx_sort )
	{
		var	elem0 = document.getElementById( sel_sort[idx_sort][0] );
		elem0.selectedIndex = 0;
		var	elem1 = document.getElementById( sel_sort[idx_sort][1] );
		elem1.selectedIndex = 0;
	}

	{
		var	elem = document.getElementById( 'chk_misc_詳細表示' );
		elem.checked = filtering_rule.show_detail;
	}
}

// ---------
/**	@brief	Delete preset
 */
function delete_preset()
{
	var	elem = document.getElementById( 'preset_name' );
	var	name = elem.value.trim();
	if( name == "" )
		return;

	var res = confirm( name + "\nを削除してよろしいですか？" );
	if( !res )
		return;

	var presets = load_preset_list();
	var	pidx = presets.findIndex( function(n){return n == name;} );
	if( pidx >= 0 )
		presets.splice( pidx, 1 );
	store_preset_list( presets );

	localStorage.removeItem( name );

	update_preset_list();
	elem.value = '';
}

// ---------
/**	@brief	Save evaulation to local storage
 */
function save_evaluation()
{
	var	data = {};
	var	idx_id = db_ms.searchColumn( 'id' );
	var	idx_eval = db_ms.searchColumn( 'eval' );
	for( var i = 0; i < db_ms.getRecordNum(); ++i )
	{
		var	val = db_ms.raw[i][idx_eval];
		if( val < 5 )
		{
			var	id = db_ms.raw[i][idx_id];
			data[id] = val;
		}
	}

	var	json = JSON.stringify( data );
	localStorage.setItem( KEYNAME_USER_EVAL, json );
}

// ---------
/**	@brief	Load evaulation from local storage
 */
function load_evaluation()
{
	var	json = localStorage.getItem( KEYNAME_USER_EVAL );
	if( !json )
		return;

	var	data = JSON.parse( json );
	var	idx_id = db_ms.searchColumn( 'id' );
	var	idx_eval = db_ms.searchColumn( 'eval' );
	for( var i = 0; i < db_ms.getRecordNum(); ++i )
	{
		var	id = db_ms.raw[i][idx_id];
		if( id in data )
			db_ms.raw[i][idx_eval] = data[id];
		else
			db_ms.raw[i][idx_eval] = DEFAULT_EVALUATION;
	}
}

// ---------
/**	@brief	Update share URL
 */
function update_share_url()
{
	// Collect modified evaluations
	var	idx_id = db_ms.searchColumn( 'id' );
	var	idx_eval = db_ms.searchColumn( 'eval' );
	var	mod = [ [], [], [], [], [] ];
	var	maxsz = 0;
	var maxval = 0;
	for( var i = 0; i < db_ms.getRecordNum(); ++i )
	{
		var	n = db_ms.raw[i][idx_eval];
		if( n < DEFAULT_EVALUATION )
		{
			var	x = db_ms.raw[i][idx_id];
			if( mod[n].length > 0 )
			{
				x = x - mod[n][0];
				if( x < 0 )
				{
					console.error( "Error: ID must be sorted." );
					return;
				}
				if( maxval < x )
					maxval = x;
			}
			else
			{
				if( maxsz < x )
					maxsz = x;
			}
			mod[n].push( x );
		}
	}
	for( var i = 0; i < mod.length; ++i )
	{
		if( maxsz < mod[i].length )
			maxsz = mod[i].length;
	}

	// Write to binary
	var	bin = new bitstream( 2048 );
	// - Calculate bits required
	var	bits_len = calc_bits_required( maxsz );
	var	bits_val = calc_bits_required( maxval );
	// - # of bits for writing id
	bin.write( (bits_val << 4) | bits_len, 8 );
	for( var i = 0; i < mod.length; ++i )
	{
		var	n = mod[i].length;
		// write # of IDs
		bin.write( n, bits_len );
		// write first ID
		bin.write( mod[i][0], bits_len );
		// write IDs
		for( var j = 1; j < mod[i].length; ++j )
		{
			n = mod[i][j];
			bin.write( n, bits_val );
		}
	}
	// - Encode to text
	var	code = encode_base64( bin );

	// Publish URL
	var	elem = document.getElementById( 'share_url' );
	var	baseurl = get_current_url();
	var	shareurl = baseurl + '?e=' + code;
	elem.value = shareurl;

	// Tweet button
	var tweet_eval_div = document.getElementById( 'tweet_eval_div' );
	if( tweet_eval_div )
		tweet_eval_div.remove();
	var	url_div = document.getElementById( 'url_div' )
	var tweet_message = '自分のＭＳ評価はこれ！\n#バトオペ2\n';
	var	div_tweet = document.createElement( 'div' );
	div_tweet.id = 'tweet_eval_div';
	div_tweet.className = 'twitter';
	div_tweet.innerHTML = '<a href="https://twitter.com/share" class="twitter-share-button" id="tweet_eval" data-show-count="false" data-text="' + tweet_message + '" data-url="' + shareurl + '" data-lang="ja">Tweet</a>';
	url_div.appendChild( div_tweet );
	twttr.widgets.load();

	// Verify
/*	bin = decode_base64( code );
	bits = bin.read( 8 );
	bits_len = bits & 0x0f;
	bits_val = bits >> 4;
	for( var i = 0; i < mod.length; ++i )
	{
		var	n = bin.read( bits_len );
		var	first = 0;
		for( var j = 0; j < n; ++j )
		{
			var id;
			if( j == 0 )
			{
				id = bin.read( bits_len );
				first = id;
			}
			else
			{
				id = first + bin.read( bits_val );
			}
			var	idx = db_ms.findIndex( idx_id, id );
			if( idx < 0 )
			{
				console.error( 'Failed to read ID' );
				return;
			}
			var	e = db_ms.raw[idx][idx_eval];
			if( e != i )
			{
				console.error( 'Eval is not valid' );
				return;
			}
		}
	}
	console.log( 'Verifying successfly' );*/
}

// ---------
/**	@brief	Decode shared evaluation
 */
function decode_share_url( e )
{
	var	idx_id = db_ms.searchColumn( 'id' );
	var	idx_eval = db_ms.searchColumn( 'eval' );

	var	bin = decode_base64( e );
	var	bits = bin.read( 8 );
	if( bits == 0 )
	{
		console.error( "Decode error: Invalid bits" );
		return;	
	}
	var	bits_len = bits & 0x0f;
	var	bits_val = bits >> 4;
	if( bits_val == 0 )
	{	// old format
		for( var i = 0; i < 5; ++i )
		{
			var	n = bin.read( bits );
			for( var j = 0; j < n; ++j )
			{
				var id = bin.read( bits );
				var	idx = db_ms.findIndex( idx_id, id );
				if( idx < 0 )
				{
					console.error( 'Failed to read ID' );
					return;
				}
				db_ms.raw[idx][idx_eval] = i;
			}
		}
	}
	else
	{
		for( var i = 0; i < 5; ++i )
		{
			var	n = bin.read( bits_len );
			var	first = 0;
			for( var j = 0; j < n; ++j )
			{
				var id;
				if( j == 0 )
				{
					id = bin.read( bits_len );
					first = id;
				}
				else
				{
					id = first + bin.read( bits_val );
				}
				var	idx = db_ms.findIndex( idx_id, id );
				if( idx < 0 )
				{
					console.error( 'Failed to read ID' );
					return;
				}
				db_ms.raw[idx][idx_eval] = i;
			}
		}
	}
}
