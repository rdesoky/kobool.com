function AppMain(){

	MatchingTimer.init();
	SMonitor.init();
	KEvents.listen("SSNUpdate",function(){
		Req("imem",	function(){
			IMem.refreshHeader();
			PgNav.reload();
		});
	});
	//U.disableSelection(document.body);
	
	TopTabs = new JCTabCtrl( {	
			"Menu.Profile":{panel:"SubMenu.Profile", onDblClick:function(){PgNav.open("mem",{mem:SSN.id});}}
			,"Menu.Update":{panel:"SubMenu.Update", onDblClick:function(){PgNav.open("update");}}
			,"Menu.Search":{panel:"SubMenu.Search", onDblClick:function(){PgNav.open("smp_srch");}}
			,"Menu.QA":{panel:"SubMenu.QA", onDblClick:function(){PgNav.open("qa",{},["p","mem"]);}}
			,"Menu.Mailbox":{panel:"SubMenu.Mailbox", onDblClick:function(){PgNav.open("kmail",{},true);}}
			,"Menu.CPoints":{panel:"SubMenu.CPoints", onDblClick:function(){PgNav.open("cp_report");}}
		}, 1
	);

	if(!_GCN("id")){
		_SH("GuestMenu");
	}

	Stats.init();
	FeaturedList.init();
	PgLayout.init();
	if(0){
		(function(d, s, id) {
			  var js, fjs = d.getElementsByTagName(s)[0];
			  if (d.getElementById(id)) {return;}
			  js = d.createElement(s); js.id = id;
			  js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=6254142583";
			  fjs.parentNode.insertBefore(js, fjs);
		}(document, 'script', 'facebook-jssdk'));
	}
}

var SMonitor={
	init:function(){
		KEvents.listen( "ServerResponse", this.setActivity, this );
		KEvents.listen( "SecondTic", this.onSecondTic, this );
		KEvents.listen( "onlogin", this.start, this );
		KEvents.listen( "onlogout", this.end, this );
		KEvents.listen( "SSNExpired",
			function(){
				IMem.logout();
				SMonitor.closeWarning();
				KUI.msgbox( { title:"session.auto_end_title", msg:"session.auto_end_notification" } );
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
			KEvents.fire("SSNUpdate");
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
				KEvents.fire("SSNExpired");
			}else if( tmOut<=0 ){
				this.closeWarning();
				KUI.msgbox( { title:"session.auto_end_title", msg:"session.auto_end_notification" } );
			}else{
				this.showWarning(tmOut);
			}
		}else{
			this.closeWarning();
		}
	},
	ping:function(){
		Http.post({
			scr: "ssn_ping.pl",
			onload: function(t){
				var r = JSN(t);
				if( !_N(r.success) ){
					KEvents.fire("SSNExpired");	
				}
			}
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
			KUI.question({
				id:"EndSession",
				title:"session.auto_end_title",
				msg:this.msg,
				yes:_S("a.logout"),
				yesHandler:function(){
					IMem.logout();
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
			Popup.close("EndSession");
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
};

var Home = {
	onload:function(){
		TopTabs.select(null);
		if(SSN.id){
			PgNav.open("my",undef,undef,true);
		}else{
			TopTabs.select("HeaderLogo");
		}
	}
};

var MatchingTimer={
	
	init:function(){
		this.time_left = _D(TMatching)?TMatching.time_left:undef,
		this.check_time = _D(TMatching)?TMatching.check_time:undef,
		KEvents.listen("SecondTic", this.onSecondTic, this);
		this.onSecondTic();
	},
	onSecondTic:function(){
		_A( _CL("MatchingTimer"), this.render() );
	},
	render:function(){
		var d=_C("a");
		var self=this;
		var calcRS = function(){
			if( !_D(self.time_left) ){
				return undef;
			}
			var now = Math.floor(_T()/1000);
			return (self.time_left - (now-self.check_time));
		};
		var setVal=function(){
			var rs = calcRS();
			if( !_D(rs) ){
				return false;
			}
			while(rs<0){
				rs+=24*60*60;
			}
			if(rs>(24*60*60-60*10)){
				_HS(d, "a.matching_now" );
				return true;
			}
			var rh = Math.floor( rs / ( 60 * 60 ) );
			var rm = Math.floor( ( rs - rh * 60 * 60 ) /  60 ) + 1;
			rs = rs % 60;
			_H(d, _S("a.mtime") + " " + rh + ":" + rm + ":" + rs );
			return true;
		};

		if( !setVal() ){
			Http.post({
				scr:"matching_time_left.pl",
				silent:1,
				onload:function(res){
					var i=JSN(res)
					self.time_left = _N(i.seconds_left);
					self.check_time=Math.floor(_T()/1000);
					setVal();
				}
			});
		}
		return d;
	}
};

var PgLayout={
	init:function(){
		KEvents.listen("resizeWindow", this.onResizeWindow, this );
		//KEvents.listen("SecondTic", this.checkHeader, this );
		KEvents.listen("onlogin", this.refreshSession, this);
		KEvents.listen("onlogout", this.refreshSession, this);
	},
	refreshSession:function(){
		//alert("refreshSession");
		Req("imem",	function(){
			IMem.refreshHeader();
			PgNav.reload();
		});
	},
	onResizeWindow:function(info){
		_E("Contents").style.minHeight = ( info.h - 120 ) + "px";
	},
	checkHeader:function(){// sync header with active session 
		if( _N(SSN.id) != _GCN("id",0) ){
			this.refreshSession();
			return false;
		}
		return true;
	}
};

var Stats={
	init:function(){
		KEvents.listen("chgPage", this.onChgPage, this );
	},
	onChgPage:function(info){
		Http.post({
			scr:gCGI.stats, 
			silent:true, 
			data:{x:1},
			onload:function(res){
				eval(res);
			}
		});
		ga('send', 'pageview', "/v2/" + info.pg);
	}
};

var FeaturedList={
	ts:0,

	init:function(){
		KEvents.listen("chgPage", this.onChgPage, this );
	},
	
	onChgPage:function(info){
		if( U.arrFind( ["list","mem","drill","declines","qa","my_recent_questions","my_q_by_member","svd_srch"], info.pg) ){
			_SH("RightSide");
			var t = _T();
			if( (t-this.ts)>(1*60*1000) ){
				this.ts=t;
				var panel = _E( "RightSideContents" );
				Http.getCGI( gCGI.featured, { "t": t },
					function( response ){
						_A( _CL(panel), "div", {"class":"pg_header center_align bold"}, _S("a.featured") );
						var res = JSN(response);
						Enum(res.child_list, 
							function(item){
								RSCR("ERender",
									 function(){
										_A(panel, ERender.featuredMem(item));
									},
									{silent:1}
								);
							}
						);
					}
				);
			}
		}else{
			_HI("RightSide");
		}
		
	}
};
