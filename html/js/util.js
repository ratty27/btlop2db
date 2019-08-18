
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
function create_pulldown(id_, items_, init_, callback)
{
	var	item = document.createElement( 'select' );
	item.id = id_;
	if( callback )
		item.addEventListener( "change", function() { callback(item); } );
	for( var i = 0; i < items_.length; ++i )
	{
		var	opt = document.createElement( 'option' );
		opt.value = i;
		opt.innerText = items_[i];
		item.appendChild( opt );
	}
	if( init_ )
		item.selectedIndex = init_;

	var div = document.createElement( 'div' );
	div.className = 'cp_ipselect cp_sl02';
	div.style.width = '100px';
	div.appendChild( item );
	return div;
}
