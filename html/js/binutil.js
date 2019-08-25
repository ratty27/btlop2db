/*
 * Copyright 2019 ratty27
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

// ---------
//	Constants
var	BASE64_CODE = [
	'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
	'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
	'0','1','2','3','4','5','6','7','8','9','+','/'
];

// ---------
/*	Bit stream class
 */

//!	@brief	Constructor
var bitstream = function(maxsize)
{
	this.buff = new Uint8Array( maxsize );
	// for writing
	this.index = 0;
	this.bits = 0;
	// for reading
	this.rindex = 0;
	this.rbits = 0;
}

//!	@brief	Write bits
bitstream.prototype.write = function( val, bits )
{
	// val = val & ((1 << bits) - 1);
	while( bits > 0 )
	{
		var	rem = Math.min( 8 - this.bits, bits );
		this.buff[this.index] |= (val << this.bits) & 0xff;
		val >>= rem;
		bits -= rem;
		this.bits += rem;
		if( this.bits >= 8 )
		{
			this.bits = 0;
			this.index++;
		}
	}
}

//!	@brief	Reset read point
bitstream.prototype.reset_read = function()
{
	this.rindex = 0;
	this.rbits = 0;
}

//!	@brief	Read bits
bitstream.prototype.read = function( bits )
{
	var	ret = 0;
	var	n = 0;
	while( n < bits )
	{
		var	rem = Math.min( 8 - this.rbits, bits - n );
		ret |= (((this.buff[this.rindex] >> this.rbits) & ((1 << rem) - 1)) << n);
		n += rem;
		this.rbits += rem;
		if( this.rbits >= 8 )
		{
			this.rbits = 0;
			this.rindex++;
		}
	}
	return ret;
}

//!	@brief	Check whether reading pointer arrived to end of stream
bitstream.prototype.eos = function()
{
	if( this.rindex < this.index )
		return false;
	else if( this.rindex > this.index )
		return true;
	else
		return this.rbits >= this.bits;
}

// ---------
/**	@brief	Encode to base64
 *	@param	bin		'bitstream' for reading
 *	@return	Encoded base64 string
 */
function encode_base64( bin )
{
	var	ret = '';
	bin.reset_read();
	while( !bin.eos() )
	{
		var	bits = bin.read( 6 );
		ret += BASE64_CODE[bits];
	}
	return ret;
}

// ---------
/**	@brief	Decode from base64
 *	@param	code	Base64 string
 *	@return	Decoded binary as 'bitstream'
 */
function decode_base64( code )
{
	var	bin = new bitstream( 2048 );
	for( var i = 0; i < code.length; ++i )
	{
		var	c = code.charAt( i );
		var	x = BASE64_CODE.indexOf( c );
		bin.write( x, 6 );
	}
	return bin;
}

// ---------
/**	@brief	Calculate bits required
 *	@param	n		Number
 *	@return	Bits required
 */
function calc_bits_required( n )
{
	if( BROWSER_TYPE == BROWSER_TYPE_IE )
	{
		var	log2_n = Math.log(n) / Math.log(2);
		return Math.floor( log2_n + 1 );
	}
	else
	{
		return Math.floor( Math.log2(n) + 1 );
	}
}
