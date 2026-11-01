var DDrop = {
	attach:function(el, mv_el, ondrag, ondrop, dt){
		var bDrag = false;
		var initMouse = {x:0, y:0};
		var initPos = {x:0, y:0};
		if(!_D(dt)){
			dt = {type:"text/plain", data:"Move this item"};
		}
		var dlog=function(txt){
			var d=_E("DLog");
			if(d){
				var ord = _C("span", {"class":"href inline",style:"width:30px"}, d.childNodes.length.toString() + ": " );
				ord.onclick = function(){_CL("DLog")};
				d.insertBefore( _C( "div", {},[	ord, _TXT(txt)] ), d.firstChild );
				return 1;
			}
			return 0;
		};
		var debug=function(e,title){
			var d=_CL("MDebug");
			if(!d){
				return;
			}

			var shiftX = e.screenX - initMouse.x;
			var shiftY = e.screenY - initMouse.y;

			_AD(d,{},title);
			_AD(d,{},"initMouse.x:" + initMouse.x);
			_AD(d,{},"initPos.x:" + initPos.x);
			_AD(d,{},"e.screenX:" + e.screenX);
			_AD(d,{},"el.style.left:" + (initPos.x + shiftX).toString() );
			_A(d,"hr");

			_AD(d,{},"initMouse.y:" + initMouse.y);
			_AD(d,{},"initPos.y:" + initPos.y);
			_AD(d,{},"e.screenY:" + e.screenY);
			_AD(d,{},"el.style.top:" + (initPos.y + shiftY).toString());
		};

		el.draggable=true;
		el.ondragstart= function(e,nolog){
			if(e && e.dataTransfer){
				e.dataTransfer.setData(dt.type,dt.data);
			}
			bDrag=true;
			initMouse.x = e.screenX;
			initMouse.y = e.screenY;
			initPos.x = mv_el ? mv_el.offsetLeft : 0;
			initPos.y = mv_el ? mv_el.offsetTop : 0;
			debug(e,"Drag Start");
			if(nolog!=1){
				dlog("ondragstart");
			}
		};
		
		if( !el.addEventListener ){//ie8
			el.onmousedown=function(e){
				if(el.setCapture){
					el.setCapture(true);
				}
				el.ondragstart(e||event, dlog("mousedown"));
			}
		}
		
		var dragging = function(e,nolog){
			if(!bDrag || e.screenX<=0 || e.screenY<=0){
				return;
			}
			var shiftX = e.screenX - initMouse.x;
			var shiftY = e.screenY - initMouse.y;
			//document.title = ( initPos.x + shiftX ) + ","  + ( initPos.y + shiftY );
			if(mv_el){
				mv_el.style.left = ( initPos.x + shiftX ).toString() + "px";
				mv_el.style.top  = ( initPos.y + shiftY ).toString() + "px";
			}
			debug(e, "Dragging");
			
			if(nolog!=1){
				dlog("ondrag");
			}
			
			if(ondrag){
				ondrag(shiftX,shiftY);
			}
		};
		document.body.ondragover = dragging;
		
		if(!el.addEventListener){
			el.onmousemove=function(e){
				if( bDrag ){
					dragging(e||event, dlog("mousemove"));
				}
			}
		}

		el.ondragend = function(e,nolog){
			bDrag=false;
			debug(e, "Drag End");
			if(nolog!=1){
				dlog("ondragend");
			}

			if(ondrop){
				var shiftX = e.screenX - initMouse.x;
				var shiftY = e.screenY - initMouse.y;
				ondrop(shiftX,shiftY);
			}
		};

		if(!el.addEventListener){
			el.onmouseup = function(e){
				if( bDrag ){
					if( _D(el.releaseCapture) ){
						el.releaseCapture();
					}
					el.ondragend(e||event,dlog("mouseup"));
				}
			};
		}
	}
};

var Popup = {
	count:0,
	blockScreen:function(){
		if(!this.blocker){
			this.blocker = DU.append( document.body, "div", {id:"ScreenBlocker"} );
		}
		this.count++;
		return this.blocker;
	},
	
	hideBlocker:function(){
		this.count--;
		if( this.count <= 0 ){
			this.count = 0;
			_HI( "ScreenBlocker" );
		}
	},

	open:function(sID, sTitle, contents, buttons, modeless ){
		var popup = _E(sID);

		if( ! popup ){
			popup = _A( document.body, "div", {id:sID, "class":"popup opacity_tr"} );
			_A( popup, "div", {"class":"trans black_bg wallpaper"} );
			var root = _A( popup, "div", {"class":"white_bg box raised"} );
			var title = _A( root, "div", {"class":"popup_title"} );
			DDrop.attach( title, popup );
			var closeBtn = _A( title, "a", {href:"#", "class":"float_right button closeBtn"} );
			closeBtn.onclick = function(){
				Popup.close(sID);
				return false;
			};
			if( _D(sTitle) ){
				if(typeof sTitle == "string"){
					_HS( _A( title, "span", {"class": "popup_title_text"} ), sTitle );
				}else{
					_A( _A(title,"span",{"class": "popup_title_text"}) , sTitle );
				}
			}
			var popupClient = popup.client = _A( root, "div", {"class":"popupClient"} );
			var btnBar = popup.btnBar = _A(root, "div", {"class":"popupBtnBar"});
			this.count ++;

			if(!modeless){
				this.blockScreen();
				_SH( "ScreenBlocker" );
			}
		}
		
		if( _D(contents) ){
			if(typeof contents == "string"){
				_HS(popup.client, contents);
			}else{
				_CL( popup.client );
				_A(popup.client, contents);
			}
		}
		var left = ( document.documentElement.clientWidth - popup.offsetWidth ) / 2 ;
		var top = ( document.documentElement.clientHeight - popup.offsetHeight ) * 1 / 3;
		left = left<0?0:left;
		top = top<0?0:top;
		popup.style.left = left.toString() + "px";
		popup.style.top = top.toString() + "px";
		
		_CL(popup.btnBar);
		var defBtn;
		if( buttons ){
			Enum(buttons, function(item){
				var btn = _A(popup.btnBar, "a", {href:"#", "class":"button"}, item.title);
				if(!defBtn || btn.isDefault){
					defBtn=btn;
				}
				btn.onclick=function(e){
					if(_D(item.onclick)){
						item.onclick();
					}
					if(!_D(item.noClose)){
						Popup.close(sID);
					}
					return false;
				};
				if(item.focus){
					btn.focus();
				}
			});
		}else{
			var ok = defBtn = _A(popup.btnBar, "a", {href:"#", "class":"button"}, _S("a.ok"));
			ok.onclick=function(e){
				Popup.close(sID);
				return false;
			};
			ok.focus();
		}
		popup.style.opacity = "1";
		
		Enum(popup.querySelectorAll("input[type='text']"), function(el){
			DU.onKeyPress(el, function(e){
				if(e.keyCode==13){
					defBtn.onclick();
					return true;
				}
				return false;
			});
		});

		return popup.client;
	},
	
	close:function(id){
		var popup = _E(id);
		if( popup ){
			popup.client = null;
			document.body.removeChild( popup );
			this.count --;
			this.hideBlocker();
		}
	}
};
