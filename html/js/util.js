/*
 * Copyright 2019 ratty27
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

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
/**	@brief	Create checkbox
 */
function create_checkbox(id_, label_, init_)
{
	var elem = document.createElement('label');
	elem.className = 'container';
	elem.innerText = label_;

	var chk = document.createElement('input');
	chk.type = 'checkbox';
	chk.id = id_;
	chk.checked = init_;
	elem.appendChild( chk );

	var spn = document.createElement('span');
	spn.className = 'checkmark';
	elem.appendChild( spn );

	return elem;
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
