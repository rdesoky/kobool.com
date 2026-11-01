var QUI = {

	renderQBrowser:function( vID, pageParams, clickHandler ){

		if( !clickHandler ){
			clickHandler = function(row, cinfo){
				PgNav.chgParams({qid:row.question},["p"]);
			};
		}

		if( Http.cache[vID] ){
			if( U.equalObjects(pageParams, Http.cache[vID].info.query, {p:1,c:1} )){
				return Http.cache[vID].render();
			}
		}

		Http.cache[vID] = new CDataViewer({
			cgi: gCGI.qlist,
			query: U.copyObject(pageParams),
			onclick:clickHandler,
			col:{
				id:{fld:"question"},
				ico:{fld:"gender",title:"",width:18, render:function(row){
						return _C("span",{"class":"flat_btn gender_" + row.gender + "_icon"});
					}
				},
				txt:{fld:"question_text",title:_S("qa:ui.question_text"), width:400, 
					render:function(row){
						var cls = _N(row.answer) ? "q_answerd":"";
						cls += _N(row.asked_before) ? " q_asked":"";
						return _C("span",{"class":cls}, row.question_text);
					}
				},
				fav:{fld:"myq",title:"",width:18,
					render:function(row){
						return QUI.favQuestionBtn(row);
					}
				},
				asked:{fld:"ask_count",title:_S("qa:ui.ask_count"),width:64},
				answerd:{fld:"answer_count",title:_S("qa:ui.answer_count"),width:64}
			},
			pageSize:10
		});
		return Http.cache[vID].render();
	},

	renderQBroswerUI:function( vID, clickHandler ){
		var r  = _C( "div", {id:"QBrowserUI", "class":"qbrowser_ui"} );
		var frm = _A( r, "form" );

		var query = {c:0, g:(SSN.id ? (SSN.gender?0:1):-1 ), to:_P("mem",0), search:"" };

		var tbl = DU.appendTable(frm,{},[{},{}]);
		
		if( !vID ){
			vID = "AnsViewer";
		}
		_A( r, this.renderQBrowser(vID, query, clickHandler) );

		var dv = Http.cache[vID];
		query = dv.info.query;
		
		var myQ;
		if(SSN.id){
			myQ = _A( _A( tbl.cols[0], new CCheckFrame().getDOM() ), [	
					_C("input", {	type: "checkbox"
							,name: "myq"
							,checked: (query.c>0 ? true : false)
					  } 
					),
					_HS( _C("span"),"qa:ui.qselect_1" )
				]
			)[0];

			myQ.onclick = function(){
				query.c = this.checked ? SSN.id:0;
				dv.setQuery( query, undef, true );
			};
		}
		
		var c2 = tbl.cols[1];
		frm.onsubmit = function(){
			query.search = frm.search.value;
			query.c = 0;
			if(SSN.id){
				myQ.checked = false
			};
			dv.setQuery( query, undef, true );
			return false;
		};
		frm.onreset = function(){
			query.search = "";
			query.langid = 0;
			query.c = SSN.id;
			dv.setQuery( query, undef, true );
		};

		var sel = _A( c2, "select" );

		Enum( [0,1,7,8,9], function(val){
			_HS( _A( sel, "option", {value:val} ), _N(val)?"options:select_qa_language.v"+val:"a.all_languages" );
		});

		sel.value = _N(dv.info.query.langid);
		sel.onchange = function(e){
			query.langid = this.value;
			Http.cache[vID].setQuery( query, undef, true );
		};

		_A( c2, _TXT( _S("qa:ui.search")+ ": " ) );
		_A( c2, "input", {name:"search", type:"text", value:query.search } );
		_A( c2, "input", {type:"submit", value:_S("qa:ui.search")} );
		_A( c2, "input", {type:"reset", value:_S("qa:ui.clear")} );

		return r;
	},

	drawAnswerBtns:function(info, root, refershAnswer, refreshPage){

		if( !root ){
			root = _C("span");
		}
		
		_HSEP(root);
		_HS( _A(root, "span", {"class":"href icon edit_icon", tip:"help:tips.answer_question"} ), "qa:ui.Answer" ).onclick = function(){
			KUI.openEditor(info.answer_text, 
				function( text ){
					//TODO: wait
					var pr = DU.replace(root, KUI.getProgress());
					Http.post({
						silent:1,
						refresh:1,
						scr: "qa/answer.pl", 
						data:{qid:info.question, answer:text},
						onload:function(t,x){
							DU.replace(pr, root);
							if(!info.answer_text){//first answer
								refreshPage(true);//invalidate tabs only
							}
							info.answer_text = text;
							info.answer_date = info.approved = 0;
							refershAnswer();
						}
					});
				},
				_TXT(info.question_text)
			);
		};

		if(info.answer_text){
			_HSEP(root);
			_HS( _A(root, "span", {"class":"href icon delete"} ), "qa:ui.DelAnswer" ).onclick=function(){
				KUI.confirm( "a.sure", 
					function(){
						Http.postUpdate( "qa/answer.pl", 
							{qid:info.question, id:info.member, answer:""},
							function(t,x){
								//alert(res);
								info.answer_text = "";
								refershAnswer();
								refreshPage(true);//invalidate tabs only
							}
						);
				});
			};
		}
		else{
			_HSEP(root);
			if(_N(info.postpone)){
				_HS( _A(root, "span", {"class":"href icon no_postpone_icon"} ), "qa:ui.not_later" ).onclick = function(){
					Http.postUpdate(
						"qa/postpone_answer.pl", 
						{qid:info.question, p:0}, 
						refreshPage	//TODO:let user know where are postponed questions
					);
				};
			}else{
				_HS( _A(root, "span", {"class":"href icon postpone_icon"} ), "qa:ui.later" ).onclick = function(){
					Http.postUpdate(
						"qa/postpone_answer.pl", 
						{qid:info.question, p:1}, 
						refreshPage	//TODO:let user know where are postponed questions
					);
				};
			}
			_HSEP(root);
			_HS( _A(root, "span", {"class":"href icon ignore_icon"} ), "qa:ui.Ignore" ).onclick=function(){
				KUI.confirm( "a.sure", 
					function(){
						Http.postUpdate(
							"qa/postpone_answer.pl", 
							{qid:info.question, p:2}, 
							refreshPage
						);
					} 
				);
			};
		}

		return root;
	},

	favQuestionBtn:function(info){
		if( KUI.opGender(info) ){
			var btn, removeQuestion, addQuestion;
			removeQuestion=function(e){
				DU.cancelBubble(e);
				if(!KUI.chkLogin()){return;}
				KUI.confirm("qa:ui.remove_my_question", function(){
					DU.removeClass(btn,"fav_on");
					DU.addClass(btn,"progress16");
					Http.post({
						refresh:1,
						silent:1,
						scr:"qa/remove_my_question.pl",
						data:{from:SSN.id, to:0, qid:_N(info.question)||info.question_text_id},
						onload:function(res){
							DU.removeClass(btn,"progress16");
							DU.addClass(btn,"fav_off");
							info.myq = 0;
							btn.onclick=addQuestion;
							_SA(btn,{tip:"qa:ui.add_fav_q"});
						}
					});
				});
			};

			addQuestion=function(e){
				DU.cancelBubble(e);
				if(!KUI.chkLogin()){return;}
				DU.removeClass(btn,"fav_off");
				DU.addClass(btn,"progress16");
				Http.post({
					refresh:1,
					silent:1,
					scr:"qa/ask.pl",
					data:{from:SSN.id, no_count:1, to:0, qid:_N(info.question)||info.question_text_id},
					onload:function(res){
						DU.removeClass(btn,"progress16");
						DU.addClass(btn,"fav_on");
						info.myq = 1;
						btn.onclick = removeQuestion;
						_SA(btn,{tip:"qa:ui.del_fav_q"});
					}
				});
			};

			if(_N(info.myq)){
				btn = _C("span",{"class":"href flat_btn fav_on", tip:"qa:ui.del_fav_q"});
				btn.onclick=removeQuestion;
			}else{
				btn = _C("span",{"class":"href flat_btn fav_off", tip:"qa:ui.add_fav_q"});
				btn.onclick=addQuestion;
			}
			return btn;
		}
	},

	favAnswerBtn:function(info){
		if( KUI.opGender(info) ){
			var btn, delBookmark, addBookmark;
			delBookmark=function(){
				if(!KUI.chkLogin()){return;}
				DU.removeClass(btn,"fav_on");
				DU.addClass(btn,"progress16");
				Http.post({
					silent:1,
					refresh:1,
					scr:"qa/remove_my_question.pl",
					data:{from:SSN.id, to:_N(info.member)||info.id, qid:_N(info.question)||info.question_text_id},
					onload:function(res){
						info.myq2m = 0;
						btn.onclick = addBookmark;
						DU.removeClass(btn,"progress16");
						DU.addClass(btn,"fav_off");
						_SA(btn, {tip:"qa:ui.add_fav_ans"});
					}
				});
			};
			addBookmark=function(){
				if(!KUI.chkLogin()){return;}
				DU.removeClass(btn,"fav_off");
				DU.addClass(btn,"progress16");
				Http.post({
					silent:1,
					refresh:1,
					scr:"qa/ask.pl",
					data:{from:SSN.id, to:_N(info.member)||info.id, qid:_N(info.question)||info.question_text_id, no_count:1},
					onload:function(res){
						btn.onclick=delBookmark;
						info.myq2m = 1;
						DU.removeClass(btn,"progress16");
						DU.addClass(btn,"fav_on");
						_SA(btn, {tip:"qa:ui.del_fav_ans"});
					}
				});
			};
			if(_N(info.myq2m)){
				btn = _C("span", {"class":"href flat_btn fav_on vtop", tip:"qa:ui.del_fav_ans"} );
				btn.onclick=delBookmark;
			}else{
				btn = _C( "span", {"class":"href flat_btn fav_off vtop", tip:"qa:ui.add_fav_ans"} );
				btn.onclick=addBookmark;
			}

			return btn;
		}
	},
	
	renderAnswer:function(info, clickHandler, refreshPage, root){
		if(!root){
			root =_C("div");
		}

		var q = _A(root,"div", {"class":"question_title"});

		_A( q, [QUI.favQuestionBtn(info),_TXT(" ")] );
		
		_A( q, "span", {"class":"href bold middle"}, info.question + ": " + info.question_text ).onclick=clickHandler;

		var dir = _N(info.language) ? (info.language == "1" ? "direction:rtl" : "direction:ltr") : "";
		var approved_css = "";

		var ans_text = _A(root,"div",{
				"class":"indent free_text" + ( _D(info.approved) ? {"0":" und_review", "1":"", "2":" rejected_text"}[info.approved] : "" )
			} 
		);
		
		if( info.answer_text ){
			var fav = _A( ans_text, QUI.favAnswerBtn(info) );
			//DU.addClass(fav, "float_left");
			var div = _A( ans_text, "div", {
					style:dir, 
					tipw:"400",
					tip:{"0":"help:tips.under_review", "1":"", "2":"help:tips.rejected"}[info.approved]
				}
			);
			_A( div, [fav, _TXT(" "), _C("span",{},info.answer_text.replace(/\n/g,"<br/>")) ] );
		}else{
			if(info.member != SSN.id){
				_A(ans_text,"div",{"class":"no_text"}, _S("a.no_answer"));
			}
		}

		var tbar = _A(ans_text, "div", {"class":"footer_bar"});
		if(_D(info.answer_text) && _D(info.answer_date)){
			var d = KUI.daysToRangeString(info.answer_date);
			_A(tbar, "span",{"class":"item_date " + d.s}, _S("a.answer_date") + ":&nbsp;" + d.t);
		}
		
		if(info.member == SSN.id){	
			QUI.drawAnswerBtns( 
				info, 
				tbar, 
				function(){// redraw answer
					QUI.renderAnswer( info, clickHandler, refreshPage, _CL(root) );
				}, 
				refreshPage 
			);
		}
		
		return root;
	},
	renderMemberAnswer:function(info){
		var root = _C("div", {"class":"sresult_root"});
		var dir = _N(info.language) ? (info.language == "1" ? "direction:rtl" : "direction:ltr") : "";
		var feedback = Feedback.draw(info);

		var clickQuestion=function(){
			var qid = _N(info.question_text_id) || _N(info.question);
			if(_P("qid")==qid){
				if((PgNav.currPage=="qa")||(PgNav.currPage=="my")){
					QA.openBrowser();
				}else{
					PgNav.open("qa",{qid:qid},["p"]);
				}
			}else{
				PgNav.chgParams({qid:qid},["p"]);
			}

		};
		var clickMember=function(){
			if(_N(info.myq2m)){//question posted to this member
				// browse 
				PgNav.open("my_q_by_member", {mem:info.id, all:1}, true);
			}else{
				PgNav.open("mem",{mem:info.id,mtab:"TAnswers"},true);
			}
		};

		var atr = _A(root,"div",{"class":"padding"});
		_A( atr, KUI.bookmarkBtn(info) );
		if( KUI.opGender(info) ){
			_A( atr, Feedback.drawBtn(feedback, info) );
		}
		_A( atr, _TXT(" ") );
		var login_id = _A( atr, "span", {"class":"login_id inline"}, info.login_id );
		login_id.onclick = clickMember;


		_A( atr, KUI.genderIcon( info, {href:false} ) );

		if( info.activated ){
			KUI.renderAttr(atr,info, {ag:"age", ms:"marital_status", c:"country" }, {href:false});
		}else{
			_A( atr,"span", {}, _S("a.inactive") );
		}

		var table = DU.appendTable(root, {cellspacing:2,cellpadding:0}, [{"class":"vtop"},{"class":"vtop"}]);

		var pic_frame = _A( table.cols[0],"div",{"class":"gallery_pic"} );
		RSCR("ERender",function(){
			ERender.drawPointsFlag( pic_frame, info );
		},{silent:1});
		var img = _A(pic_frame,"img",{src:U.picSRC(info.main_pic, info.gender, true)});
		img.onclick=clickMember;
		U.disableSelection(img);

		login_id.ontooltip = pic_frame.ontooltip=function(){
			var tt = _C("div",{style:"min-width:260px;min-height:120px;"});
			RSCR("MemVUR.vw10",function(){
				_A(tt,MemVUR.vw10.render(info));
			},{silent:1});
			return tt;
		};

		var tbar = _A(table.cols[1],"div", {"class":"answer_title"});
		_A(tbar, this.favQuestionBtn(info));
		_A(tbar,"span", {'class':"a_title bold href"}, "#" + (_N(info.question)||info.question_text_id) + ":&nbsp;" + info.question_text + "&nbsp;?" ).onclick=clickQuestion;
		var ans_text = _A(table.cols[1],"div",{"class":"indent free_text"});

		if(_D(info.answer_text)){
			var fav = _A(ans_text, QUI.favAnswerBtn(info));
			//DU.addClass(fav, "float_left");
			_A( _A(ans_text, "div", {style:dir} ), [ fav, _TXT(" "), _C("span",{},info.answer_text.replace(/\n/g,"<br/>")) ] );
		}else{
			_A(ans_text, "div", {"class":"no_text"}, _S("a.no_answer"));
		}

		var tbar = _A(ans_text, "div", {"class":"footer_bar"});
		if(_D(info.answer_text) && _D(info.answer_date) ){
			var d = KUI.daysToRangeString(info.answer_date);
			_A(tbar, "span",{"class":"item_date " + d.s}, _S("a.answer_date") + ":&nbsp;" + d.t);
		}

		
		_A(table.cols[1],"div",{"class":"indent"}, feedback);
		
		return root;
	}


};