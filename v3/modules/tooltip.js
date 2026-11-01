/**
 * Created by rdeso_000 on 1/4/2015.
 */

define(["jquery", "kevents", "utils", "dom-utils"],function($, KEvents,U, DU){

	var activeTip=null;

	var ToolTip =  {
		init:function(){
			//KEvents.listen( "mouseMotion", this.handleMouseOver, this );
		},
		handleMouseOver:function(inf){
			var target = inf.target;

			if(DU.childOf(target,_E("TipAnchor"))){
				return;
			}
			var tipped = DU.findAttr(target,"tip");

			if(!tipped){
				tipped = DU.findMethod(target,"ontooltip");
			}

			if( tipped ){
				if(!_D(tipped.ttid)){
					window.ttid = _D(window.ttid) ? window.ttid + 1 : 1;
					tipped.ttid=window.ttid;
				}
				Log("TT: " + tipped.ttid);
				ToolTip.show(tipped);
			}
		},
		show:function(el){

			if(U.cancelEvent("hideEvent", ToolTip)){
				Log("cancel hideEvent tt:" + el.ttid );
			}

			if( U.cancelEvent( "delayHideEvent", ToolTip )){
				Log("cancel delayHideEvent tt:" + el.ttid );
			}

			if(activeTip && activeTip.el==el){
				return;
			}

			Log("ToolTip.show tt:" + el.ttid );

			var pos = DU.absPos(el);
			var tip = this.createFrame(pos.left, pos.top + el.offsetHeight, el);

			_A(_CL("TipAnchor"), tip.frame);

			if( !activeTip || activeTip.frame.style.display == "none"){// starting tips
				_HI(tip.frame);
				this.showEvent = setTimeout(function(){
						delete ToolTip.showEvent;
						_SH( tip.frame );
						Log("done showEvent tt:" + el.ttid);
					},
					1000
				);
				Log("start showEvent tt:" + el.ttid);
			}

			activeTip = tip;

			var sTip = _EA(el,"tip");
			if( sTip ){
				_HS( tip.contents, sTip );
			}

			var delayedHide = function(){
				if( U.cancelEvent( "showEvent", ToolTip ) ){
					activeTip = undefined;
					Log("cancel showEvent tt:" + el.ttid);
					return;
				}
				if(!activeTip){
					return ;
				}
				Log("start hideEvent tt:" + el.ttid);
				U.cancelEvent("hideEvent", ToolTip );
				ToolTip.hideEvent = setTimeout( function(){
						Log("done hideEvent tt:" + el.ttid);
						ToolTip.hide();
					},
					500
				);
			};

			el.onmouseout =function(e){
				Log("TT onmouseout tt:" + el.ttid, Log.type.info);
				delayedHide();
			};

			if( el.ontooltip ){
				_A( tip.contents, el.ontooltip() );
				tip.frame.onmouseover = function(){
					ToolTip.show(el);
				};
				tip.frame.onmouseout = el.onmouseout;
			}

			//this.chkVisible(tip);
		},
		chkVisible:function(tip){
			if(U.dir()){
				if(tip.frame.offsetLeft<0){
					//tipf.firstChild.style.left =
					tip.frame.style.left = "0px";
				}
			}
		},
		hide:function(){
			this.hideEvent = undefined;
			activeTip = undefined;
			_CL("TipAnchor");
		},
		createFrame:function(left, top, el){
			var tipw = _N(_EA(el, "tipw", "180"));
			var fr = _C("div", {"class":"tipFrame", style:"width:"+tipw+"px"});
			//var scr_width = document.documentElement.clientWidth;
			if(U.dir()){
				left -= (_N(tipw)-el.offsetWidth);
			}else{
				//if((left+tipw)>scr_width){
				//	left=scr_width-tipw;
				//}
			}
			//if(left<0){left=0;}
			fr.style.left = left.toString() + "px";
			fr.style.top = top.toString() + "px";
			_A( fr, "div", {"class":"tipArrow"} );

			return {"el":el,
				frame:fr,
				contents:_A(fr,"div", {"class":"shadow tipContents", style:"min-width:"+(_N(tipw)-8).toString()+"px"})
			};
		}
	};

	return ToolTip;
});