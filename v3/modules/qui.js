/**
 * Created by rdeso_000 on 1/7/2015.
 */
define(["jquery","http","page-nav","utils","kui", "data-viewer","dom-utils","check-frame","k-template"],function($,$http,pgNav,$U,kui, cDataViewer,$du,CCheckFrame,$tmpl){
	var qui;
	return qui = {
		browseQuestions:function(actions, params){
			if(params === undefined){
				params = {
					g:(SSN.id ? (SSN.gender?0:1):-1 )
				};
			}
			if(actions === undefined){
				actions = {
					onclick:function(row){
						pgNav.open('qa',{qid:row.question});
						require('popup').close('QAViewer');
					}
				};
			}

			require(["popup"], function(popup){

				$tmpl.render(
					{
						tid:"#QBrowser",
						data:params,
						cache:true
					},
					actions
				).done(function(dom){
					popup.open(
						"QAViewer",
						params.memInfo?$("<span>"+params.memInfo.login_id+"</span>").dom():undefined,
						dom,
						[], // no buttons
						true
					);
				});

			});
		},

		initQABrowser:function(dom, params, actions){
			var $form = $("form",dom),searchKeyword = "", language= 0, myq = 0;
			var $listRoot = $("#QList",dom);

			function showPage(page) {
				var $docFrag = $(document.createDocumentFragment());
				var results;

				params.p = page;
				params.search = searchKeyword;
				params.langid = language;
				params.c = myq ? SSN.id : 0;

				return $http.getCGI( $http.api.qlist, params )
					.then(function (r) {
						results = r.responseXML ? $http.xml2JS(r.responseXML): JSN(r.responseText);
						return $tmpl.render(
							{
								data: results.child_list,
								$root: $docFrag,
								tid: ".browse_question",
								scrollRoot: $listRoot.dom(),
								puller: function () {
									return showPage(page + 1);
								}
							},
							actions
						);
					}).then(function(){
						return {
							results: results,
							$docFrag: $docFrag
						};
					});
			}
			function showStartPage(){
				$listRoot.html("<div class='progress'/>");
				showPage(0).done(function(pageInfo){
					$listRoot.html("").append(pageInfo.$docFrag);
				});
			}
			$form.dom().onsubmit = function(){
				searchKeyword = $form.dom().search.value;
				$listRoot.html("<div class='progress'/>");
				showPage(0).done(function(pageInfo){
					$listRoot.html("").append(pageInfo.$docFrag);
				});
				return false;
			};

			$("select",$form).on("change",function(e){
				language = e.target.value;
				showStartPage();
			});

			$("input[type=checkbox]",$form).on("change",function(e){
				myq = e.target.checked ? 1:0;
				showStartPage();
			});

			showStartPage();
		},

		renderQBrowser:function( vID, pageParams, clickHandler ){//TODO: unused

			if( !clickHandler ){
				clickHandler = function(row, cinfo){
					pgNav.chgParams({qid:row.question},["p"]);
				};
			}

			if( $http.cache[vID] ){
				if( $U.equalObjects(pageParams, $http.cache[vID].info.query, {p:1,c:1} )){
					return $http.cache[vID].render();
				}
			}

			$http.cache[vID] = new cDataViewer({
				cgi: $http.api.qlist,
				query: $U.copyObject(pageParams),
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
							return qui.favQuestionBtn(row);
						}
					},
					asked:{fld:"ask_count",title:_S("qa:ui.ask_count"),width:64},
					answerd:{fld:"answer_count",title:_S("qa:ui.answer_count"),width:64}
				},
				pageSize:10
			});
			return $http.cache[vID].render();
		},
		renderQBroswerUI:function( vID, clickHandler, target_memid ){//TODO: obsolete
			var r  = _C( "div", {id:"QBrowserUI", "class":"qbrowser_ui"} );
			var frm = _A( r, "form" );

			var query = {c:0, g:(SSN.id ? (SSN.gender?0:1):-1 ), to:_P("mem",target_memid), search:"" };

			var tbl = $du.appendTable(frm,{},[{},{}]);

			if( !vID ){
				vID = "AnsViewer";
			}
			_A( r, this.renderQBrowser(vID, query, clickHandler) );

			var dv = $http.cache[vID];
			query = dv.info.query;

			var myQ;
			if(SSN.id){
				myQ = _A( _A( tbl.cols[0], new CCheckFrame().getDOM() ), [
						_C("input", {	type: "checkbox"
								,name: "myq"
								,checked: (query.c>0)
							}
						),
						_HS( _C("span"),"qa:ui.qselect_1" )
					]
				)[0];

				myQ.onclick = function(){
					query.c = this.checked ? SSN.id:0;
					dv.setQuery( query, undefined, true );
				};
			}

			var c2 = tbl.cols[1];
			frm.onsubmit = function(){
				query.search = frm.search.value;
				query.c = 0;
				if(SSN.id){
					myQ.checked = false
				}
				dv.setQuery( query, undefined, true );
				return false;
			};
			frm.onreset = function(){
				query.search = "";
				query.langid = 0;
				query.c = SSN.id;
				dv.setQuery( query, undefined, true );
			};

			var sel = _A( c2, "select" );

			Enum( [0,1,7,8,9], function(val){
				_HS( _A( sel, "option", {value:val} ), _N(val)?"options:select_qa_language.v"+val:"a.all_languages" );
			});

			sel.value = _N(dv.info.query.langid);
			sel.onchange = function(e){
				query.langid = this.value;
				$http.cache[vID].setQuery( query, undefined, true );
			};

			_A( c2, _TXT( _S("qa:ui.search")+ ": " ) );
			_A( c2, "input", {name:"search", type:"text", value:query.search } );
			_A( c2, "input", {type:"submit", value:_S("qa:ui.search")} );
			_A( c2, "input", {type:"reset", value:_S("qa:ui.clear")} );

			return r;
		},

		favQuestionBtn:function(info){
			if( kui.opGender(info) ){
				var btn, removeQuestion, addQuestion;
				removeQuestion=function(e){
					$du.cancelBubble(e);
					if(!kui.chkLogin()){return;}
					kui.confirm("qa:ui.remove_my_question", function(){
						$du.removeClass(btn,"fav_on");
						$du.addClass(btn,"progress16");
						$http.post({
							refresh:1,
							silent:1,
							scr:$http.api.remove_fav_question,
							data:{from:SSN.id, to:0, qid:_N(info.question)||info.question_text_id},
							onload:function(res){
								$du.removeClass(btn,"progress16");
								$du.addClass(btn,"fav_off");
								info.myq = 0;
								btn.onclick=addQuestion;
								_SA(btn,{tip:"qa:ui.add_fav_q"});
							}
						});
					});
				};

				addQuestion=function(e){
					$du.cancelBubble(e);
					if(!kui.chkLogin()){return;}
					$du.removeClass(btn,"fav_off");
					$du.addClass(btn,"progress16");
					$http.post({
						refresh:1,
						silent:1,
						scr:$http.api.ask,
						data:{from:SSN.id, no_count:1, to:0, qid:_N(info.question)||info.question_text_id},
						onload:function(res){
							$du.removeClass(btn,"progress16");
							$du.addClass(btn,"fav_on");
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
			if( kui.opGender(info) ){
				var btn, delBookmark, addBookmark;
				delBookmark=function(){
					if(!kui.chkLogin()){return;}
					$du.removeClass(btn,"fav_on");
					$du.addClass(btn,"progress16");
					$http.post({
						silent:1,
						refresh:1,
						scr:$http.api.remove_fav_question,
						data:{from:SSN.id, to:_N(info.member)||info.id, qid:_N(info.question)||info.question_text_id},
						onload:function(res){
							info.myq2m = 0;
							btn.onclick = addBookmark;
							$du.removeClass(btn,"progress16");
							$du.addClass(btn,"fav_off");
							_SA(btn, {tip:"qa:ui.add_fav_ans"});
						}
					});
				};
				addBookmark=function(){
					if(!kui.chkLogin()){return;}
					$du.removeClass(btn,"fav_off");
					$du.addClass(btn,"progress16");
					$http.post({
						silent:1,
						refresh:1,
						scr:$http.api.ask,
						data:{from:SSN.id, to:_N(info.member)||info.id, qid:_N(info.question)||info.question_text_id, no_count:1},
						onload:function(res){
							btn.onclick=delBookmark;
							info.myq2m = 1;
							$du.removeClass(btn,"progress16");
							$du.addClass(btn,"fav_on");
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

			_A( q, [qui.favQuestionBtn(info),_TXT(" ")] );

			_A( q, "span", {"class":"href bold middle"}, info.question + ": " + info.question_text ).onclick=clickHandler;

			var dir = _N(info.language) ? (info.language == "1" ? "direction:rtl" : "direction:ltr") : "";
			var approved_css = "";

			var ans_text = _A(root,"div",{
					"class":"indent free_text" + ( _D(info.approved) ? {"0":" und_review", "1":"", "2":" rejected_text"}[info.approved] : "" )
				}
			);

			if( info.answer_text ){
				var fav = _A( ans_text, qui.favAnswerBtn(info) );
				//$du.addClass(fav, "float_left");
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
				var d = kui.daysToRangeString(info.answer_date);
				_A(tbar, "span",{"class":"item_date " + d.s}, _S("a.answer_date") + ":&nbsp;" + d.t);
			}

			if(info.member == SSN.id){
				qui.drawAnswerBtns(
					info,
					tbar,
					function(){// redraw answer
						qui.renderAnswer( info, clickHandler, refreshPage, _CL(root) );
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
					if((pgNav.currPage=="qa")||(pgNav.currPage=="my")){
						QA.openBrowser();
					}else{
						pgNav.open("qa",{qid:qid},["p"]);
					}
				}else{
					pgNav.chgParams({qid:qid},["p"]);
				}

			};
			var clickMember=function(){
				if(_N(info.myq2m)){//question posted to this member
					// browse 
					//pgNav.open("my_q_by_member", {mem:info.id, all:1}, true);
					pgNav.open("mem",{mem:info.id,mtab:"TAnswers4U"},true);
				}else{
					pgNav.open("mem",{mem:info.id,mtab:"TAnswers"},true);
				}
			};

			var atr = _A(root,"div",{"class":"padding"});
			_A( atr, kui.bookmarkBtn(info) );
			if( kui.opGender(info) ){
				_A( atr, Feedback.drawBtn(feedback, info) );
			}
			_A( atr, _TXT(" ") );
			var login_id = _A( atr, "span", {"class":"login_id inline"}, info.login_id );
			login_id.onclick = clickMember;


			_A( atr, kui.genderIcon( info, {href:false} ) );

			if( info.activated ){
				kui.renderAttr(atr,info, {ag:"age", ms:"marital_status", c:"country" }, {href:false});
			}else{
				_A( atr,"span", {}, _S("a.inactive") );
			}

			var table = $du.appendTable(root, {cellspacing:2,cellpadding:0}, [{"class":"vtop"},{"class":"vtop"}]);

			var pic_frame = _A( table.cols[0],"div",{"class":"gallery_pic"} );
			reuire(["e-render"],function(r){
				r.drawPointsFlag( pic_frame, info );
			});
			var img = _A(pic_frame,"img",{src:$http.picSRC(info.main_pic, info.gender, true)});
			img.onclick=clickMember;
			$U.disableSelection(img);

			login_id.ontooltip = pic_frame.ontooltip=function(){
				var tt = _C("div",{style:"min-width:260px;min-height:120px;"});
				require(["mem-view10"],function(v){
					_A(tt,v.render(info));
				});
				return tt;
			};

			var tbar = _A(table.cols[1],"div", {"class":"answer_title"});
			_A(tbar, this.favQuestionBtn(info));
			_A(tbar,"span", {'class':"a_title bold href"}, "#" + (_N(info.question)||info.question_text_id) + ":&nbsp;" + info.question_text + "&nbsp;?" ).onclick=clickQuestion;
			var ans_text = _A(table.cols[1],"div",{"class":"indent free_text"});

			if(_D(info.answer_text)){
				var fav = _A(ans_text, qui.favAnswerBtn(info));
				//$du.addClass(fav, "float_left");
				_A( _A(ans_text, "div", {style:dir} ), [ fav, _TXT(" "), _C("span",{},info.answer_text.replace(/\n/g,"<br/>")) ] );
			}else{
				_A(ans_text, "div", {"class":"no_text"}, _S("a.no_answer"));
			}

			var tbar = _A(ans_text, "div", {"class":"footer_bar"});
			if(_D(info.answer_text) && _D(info.answer_date) ){
				var d = kui.daysToRangeString(info.answer_date);
				_A(tbar, "span",{"class":"item_date " + d.s}, _S("a.answer_date") + ":&nbsp;" + d.t);
			}


			_A(table.cols[1],"div",{"class":"indent"}, feedback);

			return root;
		}


	}	
});
