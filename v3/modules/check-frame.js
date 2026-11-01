/**
 * Created by rdeso_000 on 1/28/2015.
 */
define(["jclass"],function(defineJClass){
	return defineJClass( {
		render:function(attr){
			this.dom = _C("div", attr || {"class":"radio_frame"});
			this.dom.onclick = function(e){
				var target = e ? e.target : event.srcElement;
				if(target!=this.firstChild){
					this.firstChild.focus();
					this.firstChild.click();
				}
			};
			return this.dom;
		}
	});
});

