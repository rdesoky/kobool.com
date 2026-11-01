var MemView = {
	onload:function(){
		TopTabs.select(null);

		var pr = _R( KUI.blockedEl("PageRoot") );
		var root = _A( _CL("Contents"), "div", {}, pr );
		
		this.memID = _N( _P( "mem", _GC("id",0) ) );

		if( !this.memID ){
			if( !KUI.chkLogin({nav:true}) ){
				return;
			}
		}
		
		if( this.memID == _N(_GC("id",0)) ){
			TopTabs.showTab("Menu.Profile");
		}

		Http.getCGI( gCGI.member, {mem:this.memID},
			function(response){
				_CL(root);//remove progress
				_SA(root,{id:"PageRoot"});

				var search_filters = _A(root,"div",{id:"SearchFilters","class":"pg_header"});
				var view_root = _A(root,"div",{id:"MemViewPanel", "class":"pg_body"});

				_H("Debug",response);
				var results = JSN(response);
				
				if(results.error){
					Req("popup", 
						function(){
							Popup.open("Results").innerHTML = "Error:" + _S(results.error);
						}
					);
				}else{
					search_filters.appendChild( KUI.renderSFilters( {res:results}/*, MemView*/ ) );
					if( _N(results.success) ){
						var info = MemView.info = results;
						document.title = _S("a.kobool") + " - " + _S("a.pg_title.mem") + ": " + info.login_id;
						view_root.appendChild( MemView.render(info) );
						MemView.memTab = new JCTabCtrl( 
							{	TText:"MText"
								,TAnswers:"MAnswers"
								,TNewQ:"MNewQ"
								,TPstpQ:"MPstpQ"
								,TPictures:"MPictures"
								,TRelAnswers:"MRelAnswers"
								,TAnswers4U:"MAnswers4U"
								//,TAsk:"MAsk"
							}, 
							1, 
							"onTab", 
							MemView 
						);

						MemView.memTab.showTab( PgNav.getCParam("mtab","TText") );

						if( _GC("sid") && info.activated == "1" && KUI.opGender(info) ){//record visitation
							setTimeout( function(){
									if( PgNav.currPage == "mem" && _P("mem",SSN.id) == info.id ){
										Http.post({scr:gCGI.visit, silent:true, data:{id:info.id}});
									}
								},
								10000
							);
						}
					}

					//_H( "Debug", var_dump(results) );
				}
			}
		);	
	},
	onchange:function(){
		if(this.memID!=_P("mem",SSN.id)){
			this.onload();
		}

		var navTab = PgNav.getCParam("mtab","TText");
		if(this.memTab && navTab!=this.memTab.selTab){
			this.memTab.showTab(navTab);
		}
	},
	onTab:function( id, firstShow ){
		if(PgNav.getCParam("mtab","TText")!=id){
			PgNav.chgParams({mtab:id}, undefined, false, true);
		}
		switch(id){
			case "TAnswers":
				MemView.onShowQA("MAnswers", gCGI.mem_qa, "ap", {});
				break;
			case "TNewQ":
				MemView.onShowQA("MNewQ", gCGI.my_new_q, "rq", {});
				break;
			case "TPstpQ":
				MemView.onShowQA("MPstpQ", gCGI.my_new_q, "pq", {d:1});
				break;
			case "TRelAnswers":
				MemView.onShowQA("MRelAnswers", gCGI.relevant_ans, "rap", {});
				break;
			case "TAnswers4U":
				MemView.onShowQA("MAnswers4U", gCGI.answers4u, "myap", {});
				break;
			case "TPictures":
				this.onShowPics();
				break;

		}
	},
	isRendered:function( sTab,markIt ){
		var panel = _E(sTab);
		if(!panel){
			return false;
		}
		var active_id=_EA(panel, "memid", 0);
		//var mem_id = _P("mem",SSN.id);
		//if( activeid == mem_id ){
		if( active_id == this.memID ){
			return true;
		};
		if(markIt){
			_SA(panel,{memid:this.memID});
		}
		return false;
	},
	onShowPics:function(){
		var pics_panel = _E("MPictures");
		if(!pics_panel){
			return;
		}
		if(this.isRendered("MPictures",true)){
			return;
		}
		_A(pics_panel, KUI.getProgress());

		Http.getCGI(gCGI.pics, {id: this.memID },
			function(t,x){
				_H( "Debug",t );
				var res = x ? Http.xml2JS(x) : JSN(t);
				_CL(pics_panel);
				var tn_frame = _A(pics_panel,"span",{"class":"tn_frame block"});
				var pic_frame = _A(pics_panel,"span",{"class":"pic_frame"});
				var sel = new CSelector();
				Enum(res.child_list, function(item){
					var img = _A(tn_frame,"img",{"class":"tn_frame_pic", "src":U.picSRC(item.id,MemView.info.gender,true)});
					U.disableSelection(img);
					img.onclick=function(){
						sel.select(this);
						_CL(pic_frame);
						var pr = _A(pic_frame, KUI.getProgress());
						var full_img = _A(pic_frame, "img",{"src":U.picSRC(item.id,MemView.info.gender)} );
						U.disableSelection(full_img);
						full_img.onload=function(){
							_R(pr);
						};
					};
				});

				tn_frame.firstChild && tn_frame.firstChild.onclick();

				if(res.count<2){
					_R(tn_frame);
				}
			}
		);
	},

	onShowQA:function(panelID, cgi, pgParam, cgi_params){
		var memid = this.memID;
		if( this.isRendered(panelID,true) ){
			return;
		}
		if(!cgi_params){
			cgi_params = {};
		}
		function invalidateTabs(){
			Enum(["MAnswers", "MNewQ","MPstpQ","MRelAnswers", "MAnswers4U"], function(pid){
				if(pid!=panelID){
					_SA(pid,{memid:memid});//invalidate other tab panels
				}
			});
		};
		function showPage(nPage){

			var pr = _R( KUI.blockedEl(panelID+"_root") );
			var ans_panel = _A( _CL(panelID), "div", {}, pr );
			cgi_params.p = nPage;
			cgi_params.id = cgi_params.to = memid;
			Http.getCGI( cgi, cgi_params,
				function(t){
					_CL(ans_panel);
					_SA(ans_panel,{id:panelID+"_root"});
					_H("Debug", t);
					var res = JSN(t);
					if(_E(panelID+".count")){
						_H(panelID+".count",res.total);
						_E(panelID+".count").onclick = function(){
							showPage(nPage);
						};
					}

					Enum( res.child_list, function(item){// display answer item
						var clickHandler=function(){
							PgNav.open("qa",{qid:item.question},true);
						};
						_A( ans_panel, 
							QUI.renderAnswer(item, 
								clickHandler, 
								function(bTabsOnly){//refresh page + tabs
									invalidateTabs();
									if(bTabsOnly!=true){
										showPage(nPage);
									}
								}
							)
						);
					});

					_A( ans_panel, 
						KUI.renderNav( 
							res, 
							function(nPage){
								var p={};p[pgParam]=nPage;
								PgNav.chgParams(p, undefined, false, true);
								showPage(nPage);
							} 
						) 
					);
				}
			);
		};
		Req("qa_lib",function(){
			showPage(_P(pgParam,0));
		});
	},
	openAskPopup:function(){
		if(!KUI.chkLogin()){
			return;
		}
		Req("qa_lib", 
			function(){
				Popup.open(
					"AskQ",
					undef ,
					QUI.renderQBroswerUI(
						"AskQ", 
						function(row, cinfo){
							if( _N(row.asked_before) ){
							}else if( _N(row.answer) ){
							}else{
								KUI.confirm("qa:ui.ask_confirm", function(){
									Http.postUpdate( "qa/ask.pl", 
										{from:SSN.id, to:MemView.memID, qid:row.question },
										function(t,x){
											_H("Debug", t );
											Popup.open( "Done", "a.information", KUI.askReport(Http.xml2JS(x)) );
											row.asked_before = 1;
											_SA("MAnswers4U",{memid:null});
											//invalidate tab
											_SA("MAnswers4U",{memid:0});//invalidate other tab panels
										}
									);
								});
							}
						}
					)
				);
			}
		);
	},
	render:function(info){
		var dir = _N(info.language) ? (info.language == "1" ? "direction:rtl" : "direction:ltr") : "";
		var feedback = Feedback.draw(info);

		var root = _C( "div" );
		
		if(_N(info.activated)!=1){
			_A( root,"div", {'class':"inline login_id"}, info.login_id);
			_A( root,"div", {'class':"inactive_msg"}, _S("a.inactive"));
			return root;
		}

		var tbar = _A(root, "div",{"class":"title_bar"});
		_A( tbar, [
				KUI.bookmarkBtn(info),
				Feedback.drawBtn(feedback, info),
				KUI.blockBtn(info, function(){
					RSCR("ERender",	function(){
							ERender.drawPointsFlag( pic_col, info );
						},
						{silent:1}
					);
				}),
				_TXT(" "),
				_C( "span", {'class':"inline login_id"}, info.login_id)
			] 
		);

		var ft = KUI.processText(info.ad_title);
		_A( tbar,"span", {'class':"a_title " + (ft.s||""), tip:ft.tt, tipw:300,style:dir}, ft.t);

		//_A( root, "div", {'class':'float_right item_date middle'}, KUI.renderLastLogin(info) );

		_A( root, feedback );

		var attr_root = _A(root,"div", {id:"AttrBar", "class":"attr_bar"});

		_A( attr_root, KUI.genderIcon(info) );

		KUI.renderAttr(attr_root,info,{ag:"age", ms:"marital_status", ch:"children", c:"country", st:"state", ci:"city", o:"origin_country" });
		_HSEP(attr_root);
		_A( attr_root, KUI.renderLastLogin(info) );

		var layout = DU.appendTable( 
			root, 
			{"class":""}, 
			[{"class":"mem_left_col"},{"class":"full_width info_root"}] 
		);
		
		//var pic_col = _A( root, "div", { id:"MemPicColumn", "class":"inline_block float_left" } );
		var pic_col = layout.cols[0];
		RSCR("ERender",function(){
			ERender.drawPointsFlag( pic_col, info );
		},{silent:1});

		var img = _A( pic_col,"img", { src:U.picSRC(info.main_pic, info.gender, true) } );
		U.disableSelection(img);
		img.onclick=function(){
			if(_N(info.pics_count)){
				MemView.memTab.showTab("TPictures");
			}
		};

		if( KUI.opGender(info) ) {
			var acceptUI = _A(pic_col,"div");
			var confirmAccept, drawUI;

			var handleAccept=function(frm){
				if( !KUI.chkLogin() ){
					return;
				}
				Http.postUpdate( "add2wishlist.pl", 
					{	id_wisher:SSN.id
						,id_wished:info.id
						,v:frm.visible_k[0].checked?1:0},
					function(t,x){
						_H("Debug",t);
						drawUI(Http.xml2JS(x));
				});
			};

			var handleUnaccept=function(info){
				//TODOif(!_D(info)||!_D(info.id)){
				//	alert(info.id + " is not defined" );
				//}
				KUI.confirm( "a.sure", function(){
					Http.postUpdate("delete_wish.pl", {id:info.id,r:info.rank},
						function(){
							info.rank = 0;
							drawUI(info);
					});
				});
			};

			confirmAccept=function(e){
				var frm = _C("form", {"class":"visibility_form"});
				var vsbl = _A(frm, new CCheckFrame().getDOM());
				var hddn = _A(frm, new CCheckFrame().getDOM());
				_A( vsbl, "input", {type:"radio", "class":"visible_acceptance", name:"visible_k",checked:true} );
				_HS( _A( vsbl, "span"), "options:add_wish.visible" );
				_A( hddn, "input", {type:"radio", "class":"hidden_acceptance", name:"visible_k",checked:false} );
				_HS( _A( hddn, "span"), "options:add_wish.invisible" );
				var self = this;
				RS("info:confirm", function(){
					Req("popup",function(){
						var p = Popup.open( "ConfirmKobool", 
							"info:confirm.add_kobool_title", 
							_C("div",undef,_S("info:confirm.add_kobool").replace(/\%u\%/g, info.login_id)),
							[
								{
									title:_S("a.yes")
									,focus:true
									,onclick:function(){
										handleAccept(frm);
									}
								},
								{
									title:_S("a.no")
								}
							]
						);
						_A(p, frm);
					});
				});
			};

			drawUI = function(info){
				_CL( acceptUI );
				if( !_N(info.rank) ){
					_A( acceptUI, "div", {'class':"href kobool_btn ani_heart_icon", tip:"help:tips.accept"}, _S("a.Acceptance") ).onclick=confirmAccept;
				}
				
				_A(acceptUI, KUI.renderVisitation(info));

				if( _N(info.rank) ){
					_HS( _A(acceptUI, "div", {'class':"block href icon unaccept_icon"} ), "sbtn.unaccept" ).onclick = function(){
						handleUnaccept(info);
					};
				}
				
	
			};

			drawUI(info);
			
			_A(pic_col,"div", {'class':"block href icon ask_icon",tip:"help:tips.ask"}, _S("a.ask") )
			.onclick = function(e){
				MemView.openAskPopup();
			};
		}

		//if( !SSN.id || this.memID!=SSN.id ){
		//	_A(pic_col, "div", {'class':"block href icon gift_icon", tip:"help:tips.gift_points"}, _S("m.gift_points") )
		//	.onclick=function(){
		//		if( SSN.id && MemView.memID == SSN.mate ){
		//			KUI.msgbox({
		//				msg:"a.match_gift",
		//				onclose:function(){
		//					PgNav.open("cp_report",undef,true);
		//				}
		//			});
		//		}else{
		//			PgNav.open("cp_buy");
		//		}
		//	};
		//}

		var info_root = layout.cols[1];

		var tabs = _A(info_root, "ul", {id:"MTabs","class":"tabs"});
		var tabPanels = _A( info_root,"div", {id:"MTabPanels"});
		_A( tabs, "li", {id:"TText"}, this.memID==SSN.id ? U.brackets( PgNav.createLink({pg:"upd_attr",d:{mem:false},t:"a.update"}), _S("m.info") ) :  _S("m.info") );
		var info_panel = _A(tabPanels,"div", {id:"MText"});

		if( _N(info.pics_count) ){
			_A(tabs, "li", {id:"TPictures"}, U.brackets(info.pics_count, _S("m.pics")) );
			_A(tabPanels,"div", {id:"MPictures"});
		}
		if( _N(info.answers)>0 ){
			_A(tabs, "li", {id:"TAnswers"}, U.brackets(_C("span",{"class":"href", id:"MAnswers.count"},info.answers), _S("a.answers")) );
			_A(tabPanels,"div", {id:"MAnswers"});

			if(SSN.id && KUI.opGender(info)){
				_A(tabs, "li", {id:"TRelAnswers"}, U.brackets(_C("span",{"class":"href", id:"MRelAnswers.count"},"?"), _S("a.rel_answers")) );
				_A(tabPanels,"div", {id:"MRelAnswers"});
			}
		}
		
		if( _N(this.memID) == _N(_GC("id")) ){
			if(SSN.questions>0){
				_A(tabs, "li", {id:"TNewQ"}, U.brackets(_C("span",{"class":"href", id:"MNewQ.count"},SSN.questions), _S("m.newq")) );
				_A(tabPanels,"div", {id:"MNewQ"});
			}
			_A(tabs, "li", {id:"TPstpQ"}, U.brackets(_C("span",{"class":"href", id:"MPstpQ.count"},"?"), _S("m.postponed")) );
			_A(tabPanels,"div", {id:"MPstpQ"});
		}

		if( SSN.id && KUI.opGender(info)){
			_A(tabs, "li", {id:"TAnswers4U"}, U.brackets(_C("span",{"class":"href", id:"MAnswers4U.count"},"?"), _S("a.answers4u")) );
			_A(tabPanels,"div", {id:"MAnswers4U"});
		}
		var ftab = _A(tabs,"li");
		if( KUI.opGender(info) ){
			_A(ftab, "a", {href:"#","class":"vtop", tip:"help:tips.ask"}, _S("a.ask") ).onclick=function(){
				MemView.openAskPopup();
				return false;
			};
		}

		var attr_panel = _A(info_panel,"div", {"class":"attr_panel"});

		function addAttr(col, attrList){
			Enum(attrList,function(val,attr){
				var line=_A(col,"span",{"class":"attr_line"});
				_A( line,"span",{"class":"attr_title"},_S( "filters." + attr ) + ": " );
				if( _D( info[attrList[attr]] ) ){
					_A( line,
						"span",
						{"class":"href attr_value"},
						_S( "options:sfilters." + attr + ".v" + info[val] ) 
					).onclick=function(e){
						KUI.toggleFilter(attr, val, info);
					};
				}else{
					_A( line,
						"span",
						{"class":"attr_value missing_field"},
						"(" + _S("a.not_specified") + ")"
					);
				}
			});
			return col;
		};

		addAttr(_A(attr_panel,"span",{"class":"info_col"}),
			{ht:"height",wt:"body",sh:"shape",fc:"facelook",ds:"disability"}
		);
		addAttr(_A(attr_panel,"span",{"class":"info_col"}),
			{re:"religion",la:"language",rc:"race", dst:"district",sm:"smoker"}
		);
		var col3 = addAttr(_A(attr_panel,"span",{"class":"info_col"}),
			{ed:"education",jb:"job",nc:"income"}
		);
		if( _N(info.gender) == 1){
			addAttr(col3, {dt:"dress_type",po:"polygamy"} );
		}

		_A( info_panel,"div", 
			{'class':"tmargin attr_title"},  
			this.memID==SSN.id ? U.brackets( PgNav.createLink({pg:"upd_txt",d:{mem:false},t:"a.update"}), _S("m.self_desc") ) :  _S("m.self_desc")
		);

		if(_D(info.self_desc) && info.self_desc.trim().length){
			ft = KUI.processText(info.self_desc, true);
			_A( info_panel,"div", {'class':"self_desc free_text " + (ft.s||""), tip:ft.tt, tipw:300, style:dir}, ft.t );
		}else{
			_A( info_panel,
				"div",
				{"class":"attr_value missing_field"},
				"(" + _S("a.not_specified") + ")"
			);
		}
		_A( info_panel,"div", 
			{'class':"tmargin attr_title"},  
			this.memID==SSN.id ? U.brackets( PgNav.createLink({pg:"upd_txt",d:{mem:false},t:"a.update"}), _S("m.mate_desc") ) :  _S("m.mate_desc")
		);
		if(_D(info.mate_desc) && info.mate_desc.trim().length){
			ft = KUI.processText(info.mate_desc, true);
			_A( info_panel,"div", {'class':"mate_desc free_text " + (ft.s||""), tip:ft.tt, tipw:300, style:dir}, ft.t );
		}else{
			_A( info_panel,
				"div",
				{"class":"attr_value missing_field"},
				"(" + _S("a.not_specified") + ")"
			);
		}
		
		return root;
	}
};