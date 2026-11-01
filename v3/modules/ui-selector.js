/**
 * Created by rdeso_000 on 1/8/2015.
 */
define(["jclass","dom-utils"],function(jclass,$du){

	return jclass({
		init:function(arr){
			var self = this;
			Enum( arr, function(el){
				el.onclick=function(){
					self.select(this);
				};
			});
		},
		select:function(item){
			if(this.selItem){
				$du.removeClass(this.selItem,"sel");
			}
			item=_E(item);
			$du.addClass(item,"sel");
			this.selItem=item;
		}
	});

});
