U.nameSpace("MemVUR");
MemVUR.vw5 = {
	render:function(info){
		var root = DU.create( "div",{'class':"sresult_root"} );
		var feedback = Feedback.draw(info);

		var cmd_bar = _C("div", {"class":"sresult_cmd_bar footer_bar"});

		var clickHandler=function(){
			PgNav.open("mem", {mem:info.id}, ["mtab","ap","rap","myap","tn"]);
		};

		var drawRankBtns=function(cmd_bar){
			if( KUI.opGender(info) ) {
				if(_N( info.rank ) && ( _P("ls") == "wls" )){
					_HSEP(cmd_bar);
					var vw = _N(info.visible_wish);
					var wt = (vw?"hidden":"visible");
					_HS( _A(cmd_bar,"div", {'class':"href icon " + wt + "_wish_icon"} ), "sbtn.mk_" + wt + "_wish").onclick = function(e){
						Http.postUpdate("set_wish_visibility.pl", {id:info.id,v:vw?0:1},
							function(){
								List.onload();
						});
						DU.cancelBubble(e);
					};

					_HSEP(cmd_bar);
					_HS( _A(cmd_bar,"span", {'class':"href icon unaccept_icon"} ), "sbtn.unaccept" ).onclick = function(){
						KUI.confirm( "a.sure", function(){
							Http.postUpdate("delete_wish.pl", {id:info.id,r:info.rank},
								function(){
									List.onload();
							});
						});
					};
					if( _N(info.rank) > 1 ){
						_HSEP(cmd_bar);
						_HS( _A(cmd_bar,"span", {'class':"href icon promote_icon"} ), "sbtn.promote" ).onclick=function(){
							Http.postUpdate("promote_wish.pl", {id:info.id,r:info.rank},
								function(){
									List.onload();
							});
						};
					}
					_HSEP(cmd_bar);
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

		var layout = DU.appendTable( 
			root, {border:0, cellspacing:0, cellpadding:0}, [
				{ "class":"sresult_left_col" },
				{ "class":"info_root"}
			]
		);
		
		var col_1 = layout.cols[0];
		var col_2 = layout.cols[1];
		
		U.disableSelection(
			_A(_A(col_1,"div",{"class":"pic100frame"}),"img",{src:U.picSRC(info.main_pic, info.gender, true)})
		);

		if(! _N(info.id) ){
			_A(col_2,"div", {'class':"a_title padding under_review"}, _S("a.hidden_mem"));
			return root;
		}
		
		if(!_N(info.activated)){
			_A(_A(col_2,"div"),[
				KUI.bookmarkBtn(info),
				_C("span", {'class':"login_id inline"}, info.login_id)
			]);
			_A(col_2,"div", {'class':"inactive_msg"}, _S("a.inactive"));
			_A(col_2, feedback );
			drawRankBtns( _A(root, cmd_bar) );
			return root;
		}

		col_1.onclick = clickHandler;

		RSCR("ERender",function(){
			ERender.drawPointsFlag( col_1, info );
		},{silent:1});
		

		_A(col_1, KUI.renderVisitation(info));

		var info_root = layout.cols[1];

		var ttbl = _AT(info_root,{cellspacing:0,cellpadding:2},[{},{"class":"middle title_bar"}]);
		var tbar = ttbl.cols[0];
		_A(ttbl.cols[0], KUI.bookmarkBtn(info) );
		_A(ttbl.cols[0], Feedback.drawBtn(feedback, info) );
		_A( tbar, _TXT(" ") );
		_A(ttbl.cols[0],"span", {'class':"login_id inline"}, info.login_id).onclick=clickHandler;

		var ft;
		if( _D(info.ad_title) && info.ad_title.length ){
			ft = KUI.processText(info.ad_title);
			_A( ttbl.cols[1],"span", {'class':"a_title " + (ft.s||"")}, ft.t);
		}

		_A( info_root, feedback );

		var attr_root = _A(info_root,"div", {"class":"attr_bar"});
		
		_A( attr_root, KUI.genderIcon( info ) );

		KUI.renderAttr(attr_root, info, {ag:"age", ms:"marital_status", ch:"children", c:"country", st:"state", ci:"city", o:"origin_country" });

		_HSEP(attr_root);
		_A( attr_root, KUI.renderLastLogin( info ) );


		var txt = _A(info_root, "div", {"class":"sresult_text"});

		ft = KUI.processText(info.self_desc);
		_A(txt,"div", {'class':"self_desc " + (ft.s||"")}, ft.t);
		ft = KUI.processText(info.mate_desc);
		_A(txt,"div", {'class':"mate_desc " + (ft.s||"")}, ft.t);
		
		_A( txt, cmd_bar);

		drawRankBtns(cmd_bar);

		if( _N(info.pics_count) ){
			_HSEP(cmd_bar);
			_A( cmd_bar, "span", {'class':"href icon pics_icon"}, U.brackets(info.pics_count, _S("a.pictures"), {'class':"href"} ) ).onclick=function(e){
				List.openItem(info.id, {mtab:"TPictures",ap:false,rap:false,myap:false});
			};
		}
		if( _N(info.answers)>0 ){
			_HSEP(cmd_bar);
			_A( cmd_bar, "span", {'class':"href icon question_icon"}, U.brackets( info.answers, _S("a.question_answers"), {'class':"href nowrap"} ) ).onclick=function(e){
				List.openItem(info.id, {mtab:"TAnswers",ap:false,rap:false,myap:false});
			};
		}

		if( KUI.opGender(info) ) {
			_HSEP(cmd_bar);
			_A(	cmd_bar,
				KUI.blockBtn(
					info,
					function(){
						RSCR("ERender",function(){
							ERender.drawPointsFlag( col_1, info );
						},{silent:1});
					}, 
					{title:true}
				)
			);
		}
		return root;
	}
};