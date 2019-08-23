/*
 * Copyright 2019 ratty27
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

// ---------
/**	@brief	Database class
 */
class Database
{
	//!	@brief	Constructor
	constructor()
	{
		this.columns = null;
		this.raw = null;
		this.idx_sorted = -1;
	}

	//!	@brief	Set columns name
	setColumns(columns_)
	{
		this.columns = columns_;
	}

	//!	@brief	Set raw data as DB
	setRaw(raw_)
	{
		this.raw = raw_;
	}

	//!	@brief	Get # of records
	getRecordNum()
	{
		if( this.raw )
			return this.raw.length;
		else
			return 0;
	}

	//!	@brief	Add column
	addColumn(name, init_)
	{
		this.columns.push(name);
		for( var i = 0; i < this.raw.length; ++i )
			this.raw[i].push( init_ );
	}

	//!	@brief	Get # of column
	getColumnNum()
	{
		if( this.columns )
			return this.columns.length;
		else
			return 0;
	}

	//!	@brief	Search column
	searchColumn(name)
	{
		for( var i = 0; i < this.columns.length; ++i )
		{
			if( this.columns[i] == name )
				return i;
		}
		return -1;
	}

	//!	@brief	Collect unique value
	distinct(idx)
	{
		if( typeof idx == 'string' )
			idx = this.searchColumn( idx )

		var	ret = [];
		if( idx >= 0 && idx < this.getColumnNum() )
		{
			for( var i = 0; i < this.getRecordNum(); ++i )
			{
				var	val = this.raw[i][idx];
				if( ret.findIndex(function(n){return n == val;}) < 0 )
					ret.push( val );
			}
		}
		return ret;
	}

	//!	@brief	Filter by user' rule
	filter(rule)
	{
		var	arr = [];
		for( var i = 0; i < this.raw.length; ++i )
		{
			if( rule(this.raw[i]) )
				arr.push( this.raw[i] );
		}
		var	ret = new Database();
		ret.setColumns( this.columns );
		ret.setRaw( arr );
		return ret;
	}

	//!	@brief	Sort by user's rule
	sort(rule)
	{
		var	func;
		if( typeof rule == 'string' )
		{
			var	idx = this.searchColumn( rule );
			if( idx < 0 )
			{
				console.error( "Error: Invalid column name : " + rule );
				return;
			}
			rule = idx;
		}
		if( typeof rule == 'number' )
		{
			var	idx = rule;
			func = function(a, b)
				{
					if( a[idx] < b[idx] )
						return -1;
					else if( a[idx] > b[idx] )
						return 1;
					else
						return 0;
				};
			this.idx_sorted = idx;
		}
		else
		{
			func = rule;
			this.idx_sorted = -1;
		}

		var	arr = this.raw.sort( func );
		var	ret = new Database();
		ret.setColumns( this.columns );
		ret.setRaw( arr );
		return ret;
	}

	//!	@brief	Find index
	findIndex( key, val )
	{
		var	idx = key;
		if( typeof idx == 'string' )
			idx = this.searchColumn( idx );
		if( this.idx_sorted == idx )
		{	// Binary search
			var	idx0 = 0;
			var idx1 = this.raw.length;
			while( idx0 < idx1 )
			{
				var	idx2 = Math.floor( (idx0 + idx1) / 2 );
				if( val < this.raw[idx2][idx] )
					idx1 = idx2;
				else if( val > this.raw[idx2][idx] )
					idx0 = idx2 + 1;
				else
				{
					while( idx2 > 0 )
					{
						idx2 -= 1;
						if( this.raw[idx2][idx] != val )
							return idx2 + 1;
					}
					return idx2;
				}
			}
		}
		else
		{	// Sequential search
			for( var i = 0; i < this.raw.length; ++i )
			{
				if( this.raw[i][idx] == val )
					return i;
			}
		}
		return -1;
	}
}

// ---------
/**	@brief	CSV to database
 */
function csv_to_db(csv)
{
	var	arr = csv.split( '\n' )
	var	raw = [];
	for( var i = 0; i < arr.length; ++i )
	{
		if( arr[i] == '' )
			continue;
		temp = arr[i].split( ',' )
		for( var j = 0; j < temp.length; ++j )
		{
			var	temp2 = temp[j].trim();
			if( temp2.startsWith('"') && temp2.endsWith('"') )
			{	// Parse as string
				temp[j] = temp2.slice( 1, -1 ).replace( /\\n/g, '\n' )
			}
			else
			{	// Parse as number
				temp[j] = Number( temp2 )
			}
		}
		if( temp.length > 0 )
		{
			if( typeof temp[0] == 'number' || (typeof temp[0] == 'string' && temp[0] != '') )
				raw.push( temp );
		}
	}

	header = raw[0];
	raw.shift();

	var	db = new Database();
	db.setColumns( header );
	db.setRaw( raw );
	return db;
}


