/**
 * Created by rdeso_000 on 1/7/2015.
 */

define(["kevents", "kui"],function(kevt, kui){
	return {
		init:function(){
			var self = this;
			kevt.listen( "ServerResponse", this.setActivity, this );
			kevt.listen( "SecondTic", this.onSecondTic, this );
			kevt.listen( "onlogin", this.start, this );
			kevt.listen( "onlogout", this.end, this );
			kevt.listen( "SSNExpired",
				function(){
					self.closeWarning();
					require(["mem-ui"],function(imem){
						imem.logout();
						setTimeout(function(){
							kui.msgbox( { title:"session.auto_end_title", msg:"session.auto_end_notification" } );
						},2000);
					});
				}
			);
			//DU.onKeyPress( document.body, function(){
			//	SMonitor.setActivity();
			//});
		},
		currTime:function(){
			return (new Date()).getTime();
		},
		onSecondTic:function(){
			var sid = _GC("sid");

			if( sid != this.sid ){
				this.sid = sid;
				kevt.fire("SSNUpdate");
				return;
			}

			if( !sid ){//TODO:ignore admin
				this.closeWarning();
				return;
			}
			var elapsed = ( this.currTime() - _GCN("sa") ) / 1000;
			var tmOut = (60*15) - elapsed ;

			//document.title = _GCN("sa") + " - " + tmOut;

			if( tmOut <= 60 ){
				if( tmOut< -2 ){
					kevt.fire("SSNExpired");
				}else if( tmOut<=0 ){
					this.closeWarning();
					//kui.msgbox( { title:"session.auto_end_title", msg:"session.auto_end_notification" } );
				}else{
					this.showWarning(tmOut);
				}
			}else{
				this.closeWarning();
			}
		},
		ping:function(){
			require(["http"],function(http){
				http.post({
					scr: http.api.ssn_ping,
					onload: function(t){
						var r = JSN(t);
						if( !_N(r.success) ){
							kevt.fire("SSNExpired");
						}
					}
				});
			});
		},
		showWarning:function( tmo ){
			var self = this;

			this.msg = this.msg || _C( "div", {},
				[	_HS( _C("span"), "session.auto_end_confirmation" ),
					this.counter=_TXT("0")
				]
			);

			this.counter.nodeValue = Math.floor(tmo).toString();

			if( !_E("EndSession")){
				kui.question({
					id:"EndSession",
					title:"session.auto_end_title",
					msg:this.msg,
					yes:_S("a.logout"),
					yesHandler:function(){
						require(["mem-ui"],function(imem){
							imem.logout();
						});
					},
					no:_S("a.extend"),
					noHandler:function(){
						self.ping();
					}
				});
			}
		},
		closeWarning:function(){
			if( _E("EndSession") ){
				require(["popup"],function(popup){
					popup.close("EndSession");
				});
			}
		},
		start:function(){
			this.sid = _GC("sid");
		},
		end:function(){
			this.sid = _GC("sid");
		},
		setActivity:function( info ){
			if( !_GC("sid") ){
				return;
			}
			if( info && info.url && ( info.url.indexOf("chat_ping")>=0 || info.url.indexOf("get_str") >=0 ) ){
				return;
			}

			_SC( "sa", this.currTime() );

			this.closeWarning();
		}
	}
});