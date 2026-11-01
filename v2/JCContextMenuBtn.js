var JCContextMenuBtn = DefineJClass({
	init:function( attr ){
		//this.extend( CSelector.classDef );
		this.attr = attr || {};
	},
	render:function(){
		this.dom = _C("div",{"class":"cntx_menu_btn " + (this.attr.btn_css || "") }, this.attr.contents );

		var menu = this.menu = _A( this.dom, "div", {"style":"display:none", "class":"cntx_menu " + (this.attr.menu_css || "") } );
		this.dom.onmouseover = function(e){
			DU.show(menu);
		};
		this.dom.onmouseout = function(e){
			DU.hide(menu);
		};
		this.addMenuItems( this.attr.menuItems );

		return this.dom;
	},
	addMenuItems:function( items ){
		this.getDOM();
		var self = this;
		Enum( items, function( item ){
			self.addMenuItem( item );
		});
	},
	addMenuItem:function( item ){
		this.getDOM();
		var el = _A( this.menu
					,"div"
					,{ "class":"cntx_menu_item " + (this.attr.item_css || "") + " " + ( item.css || "" ) }
					,item.contents );
		var self=this;
		el.onclick = function(e){
			DU.hide(self.menu);
			item.onclick(e);
		};
		return el;
	}
});