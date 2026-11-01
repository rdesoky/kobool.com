U.nameSpace("MemVUR");
MemVUR.vw10 = {
	render:function(info){
		var root = DU.create( "div",{'class':"inline vtop light_box mem10view"} );

		var feedback = Feedback.draw(info);

		var cmd_bar = _C("div", {"class":"inline"});
		cmd_bar.onclick=function(e){
			DU.cancelBubble(e);
		};

		var clickHandler=function(){
			PgNav.open("mem", {mem:info.id}, ["mtab","ap","rap","myap","tn"]);
		};
		var drawRankBtns=function(cmd_bar){
			if( KUI.opGender(info) ) {
				if(_N( info.rank ) && ( _P("ls") == "wls" )){
					var vw = _N(info.visible_wish);
					var wt = (vw?"hidden":"visible");
					_HS( _A(cmd_bar,"div", {'class':"href icon " + wt + "_wish_icon"} ), "sbtn.mk_" + wt + "_wish").onclick = function(e){
						Http.postUpdate("set_wish_visibility.pl", {id:info.id,v:vw?0:1},
							function(){
								List.onload();
						});
						DU.cancelBubble(e);
					};

					_HS( _A(cmd_bar,"span", {'class':"href icon unaccept_icon"} ), "sbtn.unaccept" ).onclick = function(){
						KUI.confirm( "a.sure", function(){
							Http.postUpdate("delete_wish.pl", {id:info.id,r:info.rank},
								function(){
									List.onload();
							});
						});
					};
					if( _N(info.rank) > 1 ){
						_HS( _A(cmd_bar,"span", {'class':"href icon promote_icon"} ), "sbtn.promote" ).onclick=function(){
							Http.postUpdate("promote_wish.pl", {id:info.id,r:info.rank},
								function(){
									List.onload();
							});
						};
					}
					_HS( _A(cmd_bar,"span", {'class':"href icon demote_icon"} ), "sbtn.demote" ).onclick = function(){
						Http.postUpdate("demote_wish.pl", {id:info.id,r:info.rank},
							function(){
								List.onload();
						});
					};
				}
			}
			return cmd_bar;
		};

		var layout = _AT( 
			root, {border:0}, [
				{ "class":"vtop sresult_left_col", style:"width:100px"},
				{ "class":"vtop", style:"width:180px"}
			]
		);

		var col_1 = layout.cols[0];
		var col_2 = layout.cols[1];

		var img = _A(_A(col_1,"div",{"class":"pic100frame"}),"img",{src:U.picSRC(info.main_pic, info.gender, true)});
		U.disableSelection(img);

		if(! _N(info.id) ){
			_A(col_2,"div", {'class':"a_title padding under_review"}, _S("a.hidden_mem"));
			return root;
		}

		if(!_N(info.activated)){
			_A(_A(col_2,"div"),"span", {'class':"login_id"}, info.login_id);
			_A(col_2,"div", {'class':"inactive_msg"}, _S("a.inactive"));
			_A(col_2, feedback );
			return root;
		}

		col_1.onclick = clickHandler;

		RSCR("ERender",function(){
			ERender.drawPointsFlag( col_1, info );
		}, {silent:1});
		
		_A(col_1, KUI.renderVisitation(info));

		var info_root = layout.cols[1];
		var tbar = _A(info_root,"div", {"class":"title_bar"});
		_A(tbar, KUI.bookmarkBtn(info));
		_A(tbar, Feedback.drawBtn(feedback, info) );
		_A(tbar, KUI.blockBtn(info,function(){
			RSCR("ERender",function(){
				ERender.drawPointsFlag( col_1, info );
			},{silent:1});
		}));
		_A( tbar, _TXT(" ") );
		_A( tbar,"span", {'class':"login_id link"}, info.login_id).onclick=clickHandler;
		_A( tbar, cmd_bar );
		var ft;
		if( _D(info.ad_title) && info.ad_title.length ){
			ft = KUI.processText(info.ad_title);
			_A( info_root,"div", {'class':"a_title " + (ft.s||"")}, ft.t);
		}

		_A( info_root, feedback );

		var attr_root = _A(info_root,"div", {"class":"light_txt"});
		if( _N(info.pics_count) > (_N(info.main_pic)?1:0) ){
			_A( attr_root, "span", {'class':"btn pics_icon"} ).onclick=function(e){
				List.openItem(info.id, {mtab:"TPictures",ap:false,rap:false,myap:false});
			};
		}
		if( _N(info.answers)>0 ){
			_HSEP(cmd_bar);
			_A( attr_root, "span", {'class':"btn question_icon"} ).onclick=function(e){
				List.openItem(info.id, {mtab:"TAnswers",ap:false,rap:false,myap:false});
			};
		}

		_A( attr_root, KUI.genderIcon(info) );

		Enum( {ag:"age", ms:"marital_status", ch:"children", c:"country", st:"state", ci:"city", o:"origin_country" }, 
			function renderAttr(dkey, param){
				if(_D(info[dkey])){
					_HSEP(attr_root);
					var el = _A( attr_root,"span", {'class':"href attr"} );
					el.onclick=function(e){
						KUI.toggleFilter(param, dkey, info);
					};
					KUI.setAttrText( {el:el, param:param, prefix:"filters_title." + param, data:info, dkey:dkey} );
				}
			}
		);

		_A( _AD(attr_root), KUI.renderLastLogin( info ) );

		return root;
	}
};