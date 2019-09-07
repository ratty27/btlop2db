/*
 * Copyright 2019 ratty27
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

// ---------
//	Constants
var	BROWSER_TYPE_UNKNOWN = 0;
var	BROWSER_TYPE_IE      = 1;
var	BROWSER_TYPE_EDGE    = 2;
var	BROWSER_TYPE_CHROME  = 3;
var	BROWSER_TYPE_SAFARI  = 4;
var	BROWSER_TYPE_FIREFOX = 5;
var	BROWSER_TYPE_OPERA   = 6;

// ---------
/**	@brief	Get browser type
 */
function get_browser_type()
{
	var userAgent = window.navigator.userAgent.toLowerCase();
	if( userAgent.indexOf('msie') != -1
	 || userAgent.indexOf('trident') != -1 )
		return BROWSER_TYPE_IE;
	else if(userAgent.indexOf('edge') != -1)
		return BROWSER_TYPE_EDGE;
	else if(userAgent.indexOf('chrome') != -1)
		return BROWSER_TYPE_CHROME;
	else if(userAgent.indexOf('safari') != -1)
		return BROWSER_TYPE_SAFARI;
	else if(userAgent.indexOf('firefox') != -1)
		return BROWSER_TYPE_FIREFOX;
	else if(userAgent.indexOf('opera') != -1)
		return BROWSER_TYPE_OPERA;
	else
		return BROWSER_TYPE_UNKNOWN;
}

var BROWSER_TYPE = get_browser_type();

// ---------
// Add missing functions, those are for IE.
if( !String.prototype.startsWith )
{
	String.prototype.startsWith = function(s)
	{
		return this.substr(0, s.length) === s;
	};
}
if( !String.prototype.endsWith )
{
	String.prototype.endsWith = function(s)
	{
		return this.substr(this.length - s.length, s.length) === s;
	};
}
if( !Array.prototype.findIndex )
{
	Array.prototype.findIndex = function(func)
	{
		for( var i = 0; i < this.length; ++i )
		{
			if( func(this[i]) )
				return i;
		}
		return -1;
	}
}

// ---------
/**	@brief	Get current URL
 */
function get_current_url()
{
	var	url = document.location.href;
	var	pos = url.indexOf('?');
	if( pos >= 0 )
		url = url.substr( 0, pos );
	return url;
}

// ---------
/**	@brief	Show elements
 */
function show_elements(arr)
{
	for( var i = 0; i < arr.length; ++i )
	{
		var	elem = document.getElementById( arr[i] );
		if( elem )
			elem.style.display = 'inline';
	}
}

// ---------
/**	@brief	Hide elements
 */
function hide_elements(arr)
{
	for( var i = 0; i < arr.length; ++i )
	{
		var	elem = document.getElementById( arr[i] );
		if( elem )
			elem.style.display = 'none';
	}
}

// ---------
/**	@brief	Create checkbox
 */
function create_checkbox(id_, label_, init_, callback)
{
	var	chk = '<input type="checkbox" id="' + id_ + '"';
	if( callback )
		chk += ' onclick="' + callback + '(this)"';
	if( init_ )
		chk += ' checked';
	chk += ' />';

	var	spn = '<span class="checkmark slim" />'

	return '<label id="' + id_ + '_label" class="container slim">' + label_ + chk + spn + '</label>';
}

// ---------
/**	@brief	Check whetehr checkbox is checked
 */
function is_checked(id_)
{
	var	elem = document.getElementById( id_ );
	if( elem )
		return elem.checked;
	else
		return false;
}

// ---------
/**	@brief	Enable checkbox
 */
function enable_checkbox(id_)
{
	var	chk = document.getElementById( id_ );
	if( chk )
		chk.disabled = false;

	var lbl = document.getElementById( id_ + '_label' );
	if( lbl )
		lbl.style.color = '#fdfdfd';
}

// ---------
/**	@brief	Disable checkbox
 */
function disable_checkbox(id_)
{
	var	chk = document.getElementById( id_ );
	if( chk )
		chk.disabled = true;

	var lbl = document.getElementById( id_ + '_label' );
	if( lbl )
		lbl.style.color = '#8d8d8d';
}

// ---------
/**	@brief	Create pulldown
 */
function create_pulldown(id_, items_, init_, w, callback)
{
	if( !callback )
		callback = '';
	else
		callback = ' onchange="' + callback + '(this)"';
	var	item = '<div class="cp_ipselect cp_sl02" style="width: ' + w + 'px;"><select id="' + id_ + '"' + callback + '>';
	for( var i = 0; i < items_.length; ++i )
	{
		var	attr = '';
		if( i == init_ )
			attr = ' selected';
		item += '<option value="' + i + '"' + attr + '>' + items_[i] + '</option>';
	}
	item += '</select></div>';
	return item;
}
