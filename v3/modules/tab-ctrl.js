/**
 * Created by rdeso_000 on 1/8/2015.
 */
define(["jquery", "jclass", "ui-selector", "dom-utils"],function($, jclass, selector, $du){

	return jclass( {
		init:function( map, mType, sOnShow, onShowContext ){
			this.map = {};
			this.sOnShow = sOnShow;
			this.onShowContext = onShowContext;
			if(_D(mType) ){
				this.mType = mType;
			}else{
				this.mType = 0;//0 hover, 1 click
			}
			if(_D(map)){
				for( var item in map ){
					if(_E(item)){
						$du.addClass(item, "ctab");
						this.addTab( item, map[item] );
					}
				}
			}
		},
		addTab:function( handle, target ){
			var elTab = _E(handle);
			if(!elTab){
				return;
			}

			this.map[handle] = target.panel || target;

			var self = this;
			var handler = function(e){
				if(self.selTab == handle){// already selected
					if(target.onDblClick){
						target.onDblClick();
					}else{
						self.hideTab();
					}
				}else{
					self.showTab(handle);
				}
			};
			if(this.mType){
				elTab.onclick = handler;
			}else{
				elTab.onmouseover = handler;
			}
		},
		hideTab:function(){
			this.selTab = null;
			for( var item in this.map ){
				$du.removeClass( this.map[item], "seltab");
				$du.removeClass(item, "seltab");
			}
		},
		showTab:function(handle){
			this.hideTab();
// 			for( var item in this.map ){
// 				$du.removeClass( this.map[item], "seltab");
// 				$du.removeClass(item, "seltab");
// 			}
			this.selTab = handle;

			$du.addClass(this.map[handle], "seltab");
			$du.addClass(handle, "seltab");

			if(this.sOnShow){
				var context=this.onShowContext||window;
				context[this.sOnShow](handle);
			}
		}
	}, selector);

});
