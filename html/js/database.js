
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
		var	arr = this.raw.sort( rule );
		var	ret = new Database();
		ret.setColumns( this.columns );
		ret.setRaw( arr );
		return ret;
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


