var QA={
	onload:function(){
		var header = _A( "Contents", "div", {"class":"pg_header", id:"PgHeader"} );
		_AT( header, {cellspacing:0,cellpadding:0}, [{id:"QBar"},{id:"QText"}] );
		_A( "QBar", "span", { "class":"button"}, _S("a.questions") ).onclick=function(){
			QA.openBrowser();
		};
		
		_AD( "Contents", {"class":"pg_body", id:"QAnswers"} );
		
		_AD( "QAnswers", {"id":"QASortBar"} );
		_AD( "QAnswers", {"id":"Answers"} );
		
		this.onchange();
	},
	onchange:function(){
		PgNav.scrollTop();
		var phash = PgNav.paramsHash( {ps:10, g:(SSN.id?SSN.gender:false)} );

		switch(phash.ls){
			case "bkm":
			case "wls":
			case "myq":
				if(!KUI.chkLogin({nav:true})){
					return;
				}
				break;
		}

		if(SSN.id){
			TopTabs.showTab("Menu.QA");
			TopTabs.select("QA.answers");
		}else{
			TopTabs.select("GuestMenu.qa");
		}
		
		_A( _CL("QASortBar"), QA.filterBar(phash) );
				
		this.renderList({
			root:_AD("Answers")
			,params:phash
			,onload:function(r){
				_CL("QText");
				if(_D(r.question_text) ){
					_A( "QText", QA.renderQText(r));
				}
			}
		});
	},
	renderList:function(p){
		var pr = _R( KUI.blockedEl("ResultList") );// capture existing results or insert simple spinner
		var root = _A( _CL(p.root), "div", {}, pr );// create new div containing blocked existing results
		
		Http.getCGI( gCGI.search_ans,
			p.params,
			function(res){
				_H( "Debug", res );
				_CL(root);//remove progress UI
				_SA(root,{id:"ResultList"});
				var r=JSN(res);

				if(p.onload){
					p.onload(r);
				}

				if( p.filterOn ){
					_A( root, QA.renderQText(r) );
					_A( root, QA.filterBar(p.params) );
				}
				
				QA.renderMembersAnswers(r, _AD(root));
		});

	},
	renderQText:function(r){
		if(!r.question_text){
			return undef;
		}
		var tbl = _CT( {cellspacing:0,cellpadding:0},[{style:"vertical-align:middle"},{}] );
		_A( tbl.cols[0], "span", {"class":"href bold"}, r.question_text ).onclick=function(){QA.openBrowser();};
		_A( tbl.cols[1], "span", {"class":"btn delete"} ).onclick=function(){PgNav.chgParams(undef,["qid"]);};
		return tbl.table;
	},
	renderMembersAnswers:function(results, root){
		if(!_N(results.total)){
			_A(_CL(root),"div", {"class":"pg_body title"}, _S("a.no_results"));
			return;
		}
		RAS(["str:sfilters","str:filters_title"],function(){
			Enum(results.child_list, function(info){
				_A(root,QUI.renderMemberAnswer(info));
			});
			_A(root, KUI.renderNav(results));
		});
	},
	openBrowser:function(){
		var clickHandler = function(row, cinfo){
			PgNav.open("qa", {qid:row.question},["p"]);
			//Popup.close("QAViewer");
		};

		Req("qa_lib", 
			function(){
				Popup.open(
					"QAViewer",
					undef ,
					QUI.renderQBroswerUI(
						"QAViewer", 
						clickHandler
					),
					undef,
					true
				);
			}
		);
	},

	filterBar:function(q){
		if(!SSN.id){
			return undef;
		}
		
		var re = _C("div",{"class":"sort_bar"});

		var items = ["myq","bkm","wls","act"];
		
		var act = q.ls || _P("ls","act");
		
		Enum(items, function(val){
			var sel = (val == act)? " sel ":"";
			_A(re,"span",{"class":"sort_btn " + sel},_S("qa:ui.filters." + val)).onclick=function(){
				PgNav.chgParams({ls:val},["p"],true,true);
			};
		});
		return re;
	}
};


var RecentQAnswers={
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}
		TopTabs.showTab("Menu.QA");
		TopTabs.select("QA.my_recent_q_answers");
		this.onchange();
	},
	onchange:function(){
		var pr = _R( KUI.blockedEl("PageRoot") );
		var root = _A( _CL("Contents"), "div", {}, pr );

		Http.getCGI( gCGI.recent_ans_4me, PgNav.paramsHash(), 
		function(res){
			_H("Debug", res);
			_CL(root);//remove progress
			_SA(root,{id:"PageRoot"});
			//_E("PageRoot").style.height="auto";
			QA.renderMembersAnswers(JSN(res), root);
		});
		PgNav.scrollTop();
	}
};

var RecentQuestions={
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}
		TopTabs.showTab("Menu.QA");
		TopTabs.select("QA.my_recent_questions");

		var header = _A( "Contents", "div", {"class":"pg_header", id:"PgHeader"} );

		_AT( header, {cellspacing:0,cellpadding:0}, [{id:"QBar"},{id:"QText"}] );
		_A( "QBar", "span", { "class":"button"}, _S("a.questions") ).onclick=function(){
			QA.openBrowser();
		};

		_A( "Contents", "div", {"class":"pg_body", id:"RecentQuestionsBody"} );

		this.onchange();
	},

	onchange:function(){
		_CL("QText");
		var pr = _R( KUI.blockedEl("RecentQuestions") );
		var root = _A( "RecentQuestionsBody", "div", {}, pr );

		Http.getCGI( gCGI.my_recent_q, PgNav.paramsHash(), 
		function(res){
			_H("Debug", res);
			_CL(root);//remove progress
			_SA(root,{id:"RecentQuestions"});
			var r = JSN(res);
			QA.renderMembersAnswers(r, root);
			if(_D(r.question_text) ){
				_A(_CL("QText"), QA.renderQText(r));
			}
		});

		PgNav.scrollTop();
	},

	openBrowser:function(){
		Req("qa_lib", 
			function(){
				Popup.open(
					"RQViewer",
					undef ,
					QUI.renderQBrowser(
						"RQViewer", 
						{c:SSN.id, ps:5}, 
						function(row, cinfo){
							PgNav.open(
								"my_recent_questions", 
								{qid:row.question, a:(cinfo.fld=="answer_count")?0:1},["p"]
							);
					}),
					undef,
					true
				);
			}
		);
	}
};

var MyQByMember={
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}
		TopTabs.showTab("Menu.QA");
		TopTabs.select("QA.my_q_by_member");

		var header = _A( "Contents", "div", {"class":"pg_header", id:"PgHeader"} );
		_A( "Contents", "div", {"class":"pg_body", id:"MyQByMemberBody"} );

		_A( header, "span", { "class":"button"}, _S("a.browse") ).onclick=function(){
			MyQByMember.openBrowser();
		};
	

		this.onchange();
	},

	onchange:function(){
		if( _P("mem") ){
			//_SH("QBar");_HI("QBrowser");

			var pr = _R( KUI.blockedEl("PageRoot") );
			var root = _A( "MyQByMemberBody", "div", {}, pr );

			Http.getCGI( gCGI.answers4u,
				{ to:_P("mem"), p:_P("p",0), all:_P("all",0) },
				function(res){
					_H("Debug", res);
					_CL(root);//remove progress
					_SA(root,{id:"PageRoot"});
					var r = JSN(res);

					var openProfile = function(){
						PgNav.open( "mem", {mem:r.to_member}, true );
					};
					
					var atr = _A(root,"div",{"class":"attr_bar"});
					r.id = r.to_member;
					_A( atr, [KUI.bookmarkBtn(r),_TXT(" ")] );
					_A( atr, "span", {"class":"login_id inline"}, r.login_id ).onclick=openProfile;
					_A( atr, KUI.genderIcon( r, {href:false} ) );
					if(r.activated){
						KUI.renderAttr( atr, r, {ag:"age", ms:"marital_status", ch:"children", c:"country", o:"origin_country" }, {href:false} );
					}else{
						_A( atr,"span", {}, _S("a.inactive") );
					}

					var table = DU.appendTable(root, {}, [{"class":"vtop"},{"class":"vtop"}]);
					_A(table.cols[0], MyQByMember.renderMember(r)).onclick = openProfile;

					var list = table.cols[1];

					Enum(r.child_list, function(item){
						_A(list, QUI.renderAnswer(item, function(){
							PgNav.open("my_recent_questions", {qid:item.question}, true);
						}));
					});
					_A(list, KUI.renderNav(r));
				}
			);

		}
		//else{
		//	_HI("QBar");_SH("QBrowser");
		//}
	},
	renderMember:function(info){
		var root = _C("div", {"class":"inline vtop"});
		U.disableSelection(
			_A( root, "img", {"class":"small_pic", src:U.picSRC(info.main_pic, info.gender, true)} )
		);

		return root;
	},
	
	openBrowser:function(){

		Req("qa_lib", 
			function(){
				Popup.open(
					"AskedMemQViewer",
					undef ,
					MyQByMember.renderQMBrowser("AskedMemQViewer"),
					undef,
					true
				);
			}
		);

		this.renderQMBrowser("AskedMemQViewer");
	},
	renderQMBrowser:function(vID){

		if( Http.cache[vID] ){
			return Http.cache[vID].render();
		}

		Http.cache[vID] = new CDataViewer({
			cgi:gCGI.my_questions_by_member,
			query: {},
			onclick:function(row, cinfo){
				if(cinfo.fld=="total_answers"){
					PgNav.open( "mem", {mem:row.to_member, mtab:"TAnswers"}, true );
				}else{
					PgNav.open( "my_q_by_member", {mem:row.to_member, all:(cinfo.fld!="answer_count")?1:0},["p"]);
				}
			},
			col:{
				id:{fld:"to_member"},
				ico:{fld:"gender",title:"",width:18, render:function(row){
						var ret = _C("span",{"class":"pic16frame"});
						if(_N(row.activated)){
							var img = _A( ret, "img", { src:U.picSRC( row.main_pic, row.gender, true) } ) ;
							U.disableSelection(img);
						}
						return ret;
					}
				},
				login_id:{fld:"login_id",title:_S("a.login_id"), width:200},
				asked:{fld:"asked_questions",title:"questions",width:64},
				answerd:{fld:"answer_count",title:"answers",width:64},
				total:{fld:"total_answers",title:"all answers",width:64}
			},
			pageSize:5
		});
		return Http.cache[vID].render();
	}

};
