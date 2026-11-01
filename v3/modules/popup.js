/**
 * Created by rdeso_000 on 1/7/2015.
 */
define(["jquery","dom-utils"],function($,$du){
	var myPopup;
	return myPopup = {
		count:0,
		blockScreen:function(){
			if(!this.blocker){
				this.blocker = $du.append( document.body, "div", {id:"ScreenBlocker"} );
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

		open:function( sID, sTitle, contents, buttons, modeless ){
			var $popup = $("#" + sID);

			if($popup.dom()){
				return $(".popupClient",$popup).dom();
			}
			
			this.count ++;

			$(document.body).append(
				'<div class="popup" id="' + sID + '">' +
					'<div class="popup_frame">' +
						'<div class="popup_title"><a class="button closeBtn"></a><span class="popup_title_text"></span></div>'+
						'<div class="popupClient"></div>' +
						'<div class="popupBtnBar"></div>' +
					'</div>' +
				'</div>'
			);

			$popup = $("#" + sID).dom();
			setTimeout(function(){
				$("#" + sID).addClass("slide-in");
			},1);

			if( _D(sTitle) ){
				var $title = $( ".popup_title_text", $popup);
				if(typeof sTitle == "string"){
					_HS( $title.dom(), sTitle );
				}else{
					$title.append(sTitle);
				}
			}

			$(".closeBtn", $popup).click(function(){
				myPopup.close(sID);
				return false;
			});

			if(!modeless){
				this.blockScreen();
				$("#ScreenBlocker").show();
			}

			var $popupClient = $popup.client = $( ".popupClient", $popup );

			if( _D(contents) ){
				if(typeof contents == "string"){
					_HS( $popupClient.dom(), contents );
				}else{
					$popupClient.html("").append(contents);
				}
			}

			var $btnBar = $( ".popupBtnBar", $popup );

			var $defBtn;

			if( buttons ){
				$.each(buttons, function(btnInfo){
					var $btn = $("<a class='button'></a>").html(btnInfo.title);
					$btnBar.append($btn);

					if(!$defBtn || btnInfo.isDefault){// reference first button or default
						$defBtn=$btn;
					}
					$btn.click(function(e){
						if(_D(btnInfo.onclick)){
							btnInfo.onclick();
						}
						if(!_D(btnInfo.noClose)){
							myPopup.close(sID);
						}
						return false;
					});
					if(btnInfo.focus){
						$btn.dom().focus();
					}
				});
			}
			else{
				var $ok = $defBtn = $("<button></button>").html(_S("a.ok"));
				$btnBar.append($ok);
				$ok.click(function(e){
					myPopup.close(sID);
					return false;
				});
				$ok.dom().focus();
			}

			// if popup has text box, trigger default button click on pressing enter key
			$("input [type='text']", $popup).listen("keypress", function(e){
				if(e.keyCode==13){// enter
					$defBtn.click();
					return true;
				}
				return false;
			});

			return $popupClient.dom();
		},

		close:function(id){
			var $popup = $("#" + id);

			if( $popup.dom() ){
				$popup.remove();
				$popup.client = null;
				this.count --;
				this.hideBlocker();
			}
		},
		closeAll: function () {
			$("body .popup").remove();
			this.count = 0;
			this.hideBlocker();
		}
	};
});
