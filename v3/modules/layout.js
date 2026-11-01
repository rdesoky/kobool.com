/**
 * Created by rdeso_000 on 2/15/2015.
 */
define(["jquery"],function($){

	return {
		init:function(){
			var self = this;
			require(["kevents","k-template"],function(kevt,ktmpl){
				//kevt.listen("resizeWindow", self.onResizeWindow, self );
				//kevt.listen("SecondTic", this.checkHeader, this );
				kevt.listen("onlogin", self.refreshSession, self);
				kevt.listen("onlogout", self.refreshSession, self);
				ktmpl.processTemplateNode(document.body,SSN);
				//document.body.onmouseup=function(e){
				//	kevt.fire( "mouseUp", {
				//			target:_D(e)?e.target : event.srcElement,
				//			e:_D(e)?e:event
				//		}
				//	);
				//};
				//document.body.onmousedown=function(e){
				//	kevt.fire( "mouseDown", {
				//			target:_D(e)?e.target : event.srcElement,
				//			e:_D(e)?e:event
				//		}
				//	);
				//};

				$(document.body).on("dragstart",function(e){
					e.preventDefault();
				});

				$(document.body).click(function(e){
					var $target = $(e.target), $targetParent = $target.parent();
					if($target.dom().type != "checkbox" && $targetParent.hasClass("radio_frame")){
						$check = $("input[type=checkbox]", $targetParent);
						if($check.dom()){
							$check.dom().checked = $check.dom().checked ? false:true;
						}
					}
					var tip =$target.attr("data-tip");
					if(tip){
						require(["kui"],function(kui){
							RS("help:tip",function(){
								kui.msgbox({
									title:"a.info",
									msg:"help:tips." + tip
								});
							});
						});
					}
				});

				document.body.oncontextmenu = function(e){
					if(e.target.src && e.target.src.indexOf("kpic")!=-1){
						return false;
					}
				};

				document.body.onmouseover=function(e){
					kevt.fire( "mouseMotion", {
							target:_D(e)?e.target : event.srcElement,
							e:_D(e)?e:event
						}
					);
				};
				window.onresize = function(){
					kevt.fire("resizeWindow", {
						h:document.documentElement.clientHeight,
						w:document.documentElement.clientWidth
					});
				};
				window.onscroll = function(){
					var docEl = document.documentElement || {};
					var info = {
						x:window.pageXOffset,
						y:window.pageYOffset,
						w:window.innerWidth,
						h:window.innerHeight,
						scrollY: docEl.scrollTop || document.body.scrollTop,
						scrollX: docEl.scrollLeft || document.body.scrollLeft
					};
					kevt.fire("scrollWindow", info);
					Log(info, Log.type.warn);
				};
				window.setInterval(
					function(){
						kevt.fire("SecondTic");
					},
					1000
				);
				window.onresize();
			});
		},
		refreshSession:function(){
			//alert("refreshSession");
			require(["mem-ui","page-nav"],function(imem,pgNav){
				imem.refreshHeader();
				pgNav.reload();
			});
		},
		onResizeWindow:function(info){
			_E("Contents").style.minHeight = ( info.h - 120 ) + "px";
		},
		checkHeader:function(){//sync header with active session
			if( _N(SSN.id) != _GCN("id",0) ){
				this.refreshSession();
				return false;
			}
			return true;
		}
	};

});
