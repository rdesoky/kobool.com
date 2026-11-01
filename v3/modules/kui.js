/**
 * Created by rdeso_000 on 1/4/2015.
 */

define(["jquery","page-nav","js-promise","dom-utils","utils","http"],function($,$pgNav,CPromise,$du,$u,$http){

	Date.prototype.sql = function( sqlDate ){
		var arr = sqlDate.split(/\:|\-| /g);
		this.setUTCFullYear( _N(arr[0]) );
		this.setUTCMonth	( _N(arr[1]) - 1 );
		this.setUTCDate	( _N(arr[2]) );
		this.setUTCHours	( _N(arr[3]) );
		this.setUTCMinutes ( _N(arr[4]) );
		this.setSeconds ( _N(arr[5]) );
		return this;
	};

	String.prototype.replaceFieldsAsync = function($d,$context){
		var ret = this.replaceFields($d,$context);
		if( ret.constructor === CPromise ){
			return ret;
		}
		return CPromise.as(ret);
	};

	String.prototype.replaceFields = function($d,$context){
		var ret = this.toString();
		try{
			ret = decodeURI(ret);
		}catch(e){
			
		}

		var findCode = /\(\?(.*?)\?\)/;

		while ( findCode.exec(ret) ) {
			var val = eval(RegExp.$1);
			if( val === undefined){
				val = "";
			}
			if ( CPromise.is(val) ) {//TODO: bug only one promise value could be properly replaced
				return val.then( function(v){
					return ret.replace(findCode, v);
				});
			}
			ret = ret.replace( findCode, val );
		}

		var findFields = /\{\{(.*?)\}\}/;

		while (findFields.exec(ret)) {
			var val = $u.collectionItem($d,RegExp.$1);
			if (val===undefined) {
				val = "";
			}
			ret = ret.replace( findFields, val );
		}

		return ret;
	};

	String.prototype.isNumber = function(){
		return ( this.search(/^\d+$/)!= -1 );
	};

	String.prototype.isValidEmail = function(){
		return ( this.match(/^\w+[\+\.\w-]*@([\w-]+\.)*\w+[\w-]*\.([a-z]{2,4}|\d+)$/i) );
	};

	String.prototype.digitsCount = function(){
		var match = this.match(/[\d]/g);
		return ( match ? match.length : 0 );
	};

	String.prototype.trim = function(){
		return this.replace(/(^\s*)|(\s*$)/g, "");
	};

	String.prototype.optimizeSpaces = function(){
		return this.trim().replace(/\s+/g," ");
	};

	String.prototype.repeat = function(n){
		return new Array(n+1).join(this);
	};

	String.prototype.toArray = function(){
		return this.split("");
	};

	var module, $kui;

	return module = $kui = {
		fids:{
			g:"gender",
			ag:"age",
			ms:"marital_status",
			ch:"children",
			c:"country",
			st:"state",
			ci:"city",
			o:"origin_country",
			ht:"height",
			wt:"body",
			jb:"job",
			nc:"income",
			la:"language",
			rc:"race",
			ed:"education",
			sm:"smoker",
			re:"religion",
			ds:"disability",
			dt:"dress_type",
			sh:"shape",
			fc:"facelook",
			dst:"district",
			po:"polygamy"
		},

		scrollTrigger:function(onVisible, scrollRoot){
			var $trigger = $('<div class="data_puller"></div>');
			var $scrollRoot = scrollRoot ? $(scrollRoot) : $(window);

			function onScroll(e){
				if(!$(document.body).contains($trigger)){// removed from DOM
					$scrollRoot.unbind("scroll", onScroll);
					return;
				}
				if($trigger.inViewPort( scrollRoot )) {
					e.stopPropagation();
					$scrollRoot.unbind("scroll", onScroll);
					onVisible();
				}
			}

			$scrollRoot.listen("scroll", onScroll);

			return $trigger;
		},

		dataPuller:function(dataLoader,info){
			var $puller;
			function onVisible(){
				$puller.addClass("loading");
				dataLoader($puller,info).done(function(pageInfo){
					pageInfo.$docFrag.insertBefore($puller);
					$puller.remove();
				});
			}
			$puller = this.scrollTrigger(onVisible, info.scrollRoot);
			$puller.click(onVisible);
			return $puller;
		},

		topPuller:function(dataLoader,info){
			var $puller;
			function onVisible(){
				$puller.addClass("loading");
				dataLoader($puller,info).done(function(pageInfo){
					pageInfo.$docFrag.insertBefore($puller);
					var top = $puller.dom().offsetTop;
					$puller.remove();
					window.scrollTo(0,top-100);
				});
			}
			$puller = this.scrollTrigger(onVisible, info.scrollRoot).removeClass("data_puller").addClass("top_puller");
			$puller.click(onVisible);
			return $puller;
		},
		initFavQuestion:function($favBtn,info){
			if(module.opGender(info)) {
				$favBtn.addClass(info.myq == 0 ? "fav_off" : "fav_on");
				$favBtn.click(function (e) {// toggle fav question
					if(!module.chkLogin()){
						return;
					}
					if(info.myq==0){
						//Add to favorite questions
						$favBtn.removeClass("fav_off").addClass("progress16");
						$http.post({
							refresh:1,
							silent:1,
							scr:$http.api.ask,
							data:{from:SSN.id, no_count:1, to:0, qid:_N(info.question)||info.question_text_id},
							onload:function(res){
								$favBtn.removeClass("progress16").addClass("fav_on");
								info.myq = 1;
								$favBtn.attr("tip", "qa:ui.del_fav_q");
							}
						});
					}else{
						//Remove from favorite questions
						module.confirm("qa:ui.remove_my_question", function(){
							$favBtn.removeClass("fav_on").addClass("progress16");
							$http.post({
								refresh:1,
								silent:1,
								scr:$http.api.remove_fav_question,
								data:{from:SSN.id, to:0, qid:_N(info.question)||info.question_text_id},
								onload:function(res){
									$favBtn.removeClass("progress16").addClass("fav_off");
									info.myq = 0;
									$favBtn.attr("tip","qa:ui.add_fav_q");
								}
							});
						});
					}
				});
			}


		},
		initAnswer:function(el,info){// called by templates
			if(!SSN.id || module.opGender(info)) {
				var $qfav = $(".question_title .flat_btn", el);
				module.initFavQuestion($qfav,info);
				var $afav = $(".answer_text .flat_btn", el);
				if(module.opGender(info)) {
					$afav.addClass(info.myq2m == 0 ? "fav_off" : "fav_on");
				}

				$afav.click(function (e) {// toggle fav answer
					if(!module.chkLogin()){
						return;
					}
					var $btn = $(e.target);
					if(info.myq2m==1){// remove favorite answer
						$btn.removeClass("fav_on").addClass("progress16");
						$http.post({
							silent:1,
							refresh:1,
							scr:$http.api.remove_fav_question,
							data:{from:SSN.id, to:_N(info.member)||info.id, qid:_N(info.question)||info.question_text_id},
							onload:function(res){
								info.myq2m = 0;
								$btn.removeClass("progress16").addClass("fav_off");
								$btn.attr("tip","qa:ui.add_fav_ans");
								$(".mem_profile .tabs_root>div").attr("memid",null);// refresh profile tabs if found
							}
						});
					}else{// add favorite answer
						$btn.removeClass("fav_off").addClass("progress16");
						$http.post({
							silent:1,
							refresh:1,
							scr:$http.api.ask,
							data:{from:SSN.id, to:_N(info.member)||info.id, qid:_N(info.question)||info.question_text_id, no_count:1},
							onload:function(res){
								info.myq2m = 1;
								$btn.removeClass("progress16").addClass("fav_on");
								$btn.attr("tip","qa:ui.del_fav_ans");
								$(".mem_profile .tabs_root>div").attr("memid",null);// refresh profile tabs if found
							}
						});
					}
				});
			}else{// remove favorite icons
				$(".question_title .flat_btn", el).removeClass("fav_on fav_off");
				$(".answer_text .flat_btn", el).removeClass("fav_on fav_off");
			}

			$(".qtitle_text",el).click(function(){
				if( _P("qid") == info.question ){
					require(["qui"],function(qui){
						qui.browseQuestions();
					});
				}else{
					switch(_P("pg")){
						case "qa":
						case "my_recent_questions":
							$pgNav.chgParams({qid:info.question,ls:_P("ls")}, true);// remove all other params
							break;
						default:
							var params = {qid:info.question};
							if(_P("mtab")=="TAnswers4U"){
								params.ls = "myq";
							}

							$pgNav.open("qa", params, true);
					}

				}
			});
		},

		initAttrBar:function(el,info){// called by templates
			$(".profilePic, .login_id",el).click( function(){
				module.openMemPage(info.id,undefined,false);
			});
		},

		onBtnLogout:function(){
			require(["mem-ui"],function(imem){
				imem.logout()
					.done(function(){
						$pgNav.open("home");
					});
			});
			return false;
		},

		cssVisible:function(attr){
			if( ( attr === undefined ) || ( attr == false ) ){
				return "hidden";
			}
			return "visible";
		},

		myVisitCSS:function($d){
			var css = [];
			css.push(_N($d.rank) > 0 ? "ani_heart_icon":"x_heart_icon" );
			css.push(_N($d.rank) > 0 ? (_N($d.visible_wish) > 0 ? "visible_acceptance":"hidden_acceptance" ) : "");
			return css.join(" ");
		},
		initBrowsedQustion:function(el, context, actions){
			$(".qtext",el).click(function(){
				actions.onclick(context,el);
			});
			module.initFavQuestion($(".flat_btn",el), context);
		},
		initProfileHighlights:function(el,context){
			$(".pics_icon",el).click( function(){
				module.openMemPage(context.id,{mtab:"TPictures"});
			});

			$(".question_icon",el).click( function(e){
				module.openMemPage(context.id,{mtab:"TAnswers"});
			});
		},
		initProfileActions:function(el, memInfo){
			$(".hidden_wish_icon,.visible_wish_icon").click(function(e){
				require(["kactions"],function(actions){
					actions.toggleWishVisibility($(e.target),memInfo);
				});
			});
			$(".accept_icon",el).click(function(){
				require(["kactions"],function(actions){
					actions.onClickKobool(memInfo);
				});
			});
			$(".promote_icon",el).click(function(el){
				require(["kactions"],function(actions){
					actions.onClickPromote(memInfo)
				});
			});
			$(".demote_icon",el).click(function(el){
				require(["kactions"],function(actions){
					actions.onClickDemote(memInfo)
				});
			});
			$(".unaccept_icon",el).click(function(){
				require(["kactions"],function(actions){
					actions.onClickRemoveKobool(memInfo);
				});
			});
			$(".ask_icon",el).click(function(){
				require(["kactions"],function(actions) {
					actions.onClickAsk(memInfo);
				});
			});
			$(".fav_icon",el).click( function(e){
				require(["kactions"],function(kact){
					kact.onclickBookmark(memInfo, e.target);
				});
			});

			$(".btn_block",el).click( function(e){
				require(["kactions"],function(kact){
					kact.onclickBlock(memInfo, e.target);}
				);
			});
			$(".btn_update",el).click( function(e){
				$pgNav.open("update");
			});

			$(".btn_contact",el).click(function(){
				$pgNav.open("chat");
			})
		},
		initMemTemplate:function(el, context){

			if(context.id!=0) {
				module.initProfileActions(el,context);

				$(".pic100frame, .login_id, .block_icon", el).click(function () {
					module.openMemPage(context.id);
					//$pgNav.chgParams({mem:context.id});
				});
			}
		},
		initAnswerHMenu:function(el, $d) {
			var $menu = $du.initMenuBtn(el, $d);
			$menu.click(function(e) {
				var $btn = $(e.target);
				var menu_id = $btn.attr("data-menu-id");
				switch (menu_id) {
					case "hide_kobool":
					case "show_kobool":
						require(["kaction"],function(kact){
							kact.toggleWishVisibility($btn,$d);
						});
						break;
					case "later":
						$http.postUpdate(
							$http.api.answer_later,
							{qid:$d.question, p:1},
							function(){
								$(el).parent().remove();
								$("#MPstpQ,#MNewQ").attr("memid",null);
							}
						);
						break;
					case "not_later":
						$http.postUpdate(
							$http.api.answer_later,
							{qid:$d.question, p:0},
							function(){
								$(el).parent().remove();
								$("#MPstpQ,#MNewQ").attr("memid",null);
							}
						);
						break;
					case "delete":
						module.confirm( "a.sure",
							function(){
								$http.postUpdate( $http.api.post_answer,
									{qid:$d.question, id:$d.member, answer:""},
									function(t,x){
										$(el).parent().remove();
										$("#MNewQ,#MAnswers").attr("memid",null);
									}
								);
							});
						break;
					case "reject":
						module.confirm( "a.sure",
							function() {
								$http.postUpdate(
									$http.api.answer_later,
									{qid: $d.question, p: 2},
									function () {
										$(el).parent().remove();
										$("#MNewQ").attr("memid",null);
									}
								);
							}
						);
						break;
					case "report":
						module.showNotImplemented();
						break;
				}
			});
		},
		initMemberHMenu:function(el, memInfo){
			var $menu = $du.initMenuBtn(el, memInfo);
			$menu.click(function(e){
				var menu_id = $(e.target).attr("data-menu-id");
				switch(menu_id){
					case "accept":
						require(["kactions"],function(actions){
							actions.onClickKobool(memInfo);
						});
						break;
					case "unaccept":
						require(["kactions"],function(actions){
							actions.onClickRemoveKobool(memInfo);
						});
						break;
					case "block":
						require(["kactions"],function(actions){
							actions.onclickBlock(memInfo, e.target);}
						);
						break;
					case "unblock":
						require(["kactions"],function(actions){
							actions.onclickBlock(memInfo, e.target);
						});
						break;
					case "ask":
						require(["kactions"],function(actions) {
							actions.onClickAsk(memInfo);
						});
						break;
					case "promote":
						require(["kactions"],function(actions){
							actions.onClickPromote(memInfo)
						});
						break;
					case "demote":
						require(["kactions"],function(actions){
							actions.onClickDemote(memInfo)
						});
						break;
					case "report":
						module.showNotImplemented();
						break;
				}
			});

		},
		openMemPage:function(id,params){
			if(_D(params)){
				params.mem = id;
			}else{
				params = {"mem":id};
			}
			$pgNav.open("mem", params);
		},

		visitorCSS:function($d){
			//<span data-exists-if="(? $d.visits_count==0 && $d.wished==0 ?)" class="visitor visit_heart x_heart_icon" tipw="300" tip="help:profile.no_kobool_chance"></span>
			//<span data-exists-if="(? $d.visits_count!=0 && $d.wished==0 ?)" class="visitor visit_heart unk_heart_icon" tipw="300" tip="help:profile.unk_kobool"></span>
			//<span data-exists-if="(? $d.wished==1 ?)" class="visitor visit_heart ani_heart_icon" tipw="300" tip="help:profile.wisher"></span>
			if($d.visits_count==0 ){
				return "x_heart_icon";// no kobool
			}
			if($d.visits_count!=0 && $d.wished==0){
				return "unk_heart_icon";
			}
			if( $d.wished==1 ){
				return "ani_heart_icon";
			}
			return "";
		},

		visitorHeartTip:function(info){
			return "";
		},

		genderIcon:function(info,opt){
			var btn = _C( "span", {"class":"flat_btn gender_" + info.gender + "_icon"});
			if(!(opt&&!opt.href)){
				$du.addClass(btn,"href");
				btn.onclick=function(){
					module.toggleFilter("g","gender", info);
				};
			}
			return btn;
		},

		memTooltip:function(memID){
			var ret = _C("div",{},module.getProgress());
			http.getCGI(http.api.member,{mem:memID},function(res){
				require("mem-view10",function(view){
					var r=JSN(res);
					_A(_CL(ret),view.render( r ));
				},{silent:1});
			});
			return ret;
		},

		blockBtn:function(info, onfinish, opt){
			if(!this.opGender(info)){
				return undefined;
			}
			var btn, on=_N(info.blocked);
			btn = _C( "span", {'class':"href " + (on?"block_on":"block_off"), tip:"help:tips." + (on?"unblock":"block")} );

			if(opt&&opt.title){
				$du.addClass(btn,"icon");
				_H(btn,_S("a.block"));
			}else{
				$du.addClass(btn,"btn");
			}

			btn.onclick=function(e){
				require(["kactions"],function(kact){
					kact.onclickBlock(info, btn, onfinish);
				});
			};
			return btn;
		},

		bookmarkBtn:function(info){
			var btn, on = _N(info.bookmark);
			btn = _C( "span", {'class':"btn " + (on?"fav_on":"fav_off"), tip:"help:tips." + (on?"unbookmark":"bookmark")} );
			btn.onclick=function(){
				require(["kactions"],function(kact){
					kact.onclickBookmark(info, btn);
				});
			};
			return btn;
		},

		processText:function(txt, br){
			if(!_D(txt)){
				return {t:""};
			}
			var t = (br?txt.replace(/\n/g,"<br/>"):txt).trim();
			if(t=="|u|"||t=="|u||o|"){
				return {t:_S("a.under_review"), s:"under_review", tt:"help:tips.under_review"};
			}else if(0==t.indexOf("|u|")){
				return {t:t.replace("|u|",""), s:"under_review", tt:"help:tips.under_review"};
			}else if(t=="|r|"){
				return{t:_S("a.rejected"), s:"rejected", tt:"help:tips.rejected" };
			}else if(0==t.indexOf("|r|")){
				return{t:t.replace("|r|",""), s:"rejected", tt:"help:tips.rejected" };
			}
			return{t:t};
		},

		chkLogin:function(p){
			if( SSN.id ){
				return true;
			}
			if( p && p.nav ){
				$pgNav.open("login",{target:_P("pg")})
			}else{
				this.msgbox({title:"a.info", msg:"a.login_required"});
			}

			return false;
		},

		loginMSG:function(){
			var dom =  _C("center");
			var frame = _A(_A(dom,"div",{"class":"inline form_frame tmargin"}), "div", {"class":"big_font wide_padding"})
			_HS(frame, "a.login_required");
			return dom;

		},

		opGender:function(info){
			return !SSN.id || (SSN.gender != _N(info.gender) );
		},

		openEditor:function(oldText, onUpdate, title){
			require(["popup"], function(popup){
				var editor = _C("textarea",{"class":"std_textarea"}, oldText || "");

				popup.open("TextEditor", title, editor,[
					{
						title:_S("a.save"),
						onclick:function(){
							if(editor.value!=oldText){
								onUpdate( editor.value );
							}
						}
					},
					{
						title:_S("a.cancel")
					}
				]);
				editor.focus();
			});
		},
		showNotImplemented:function(){
			module.msgbox({msg:$("<div>" + _S("a.not_implemented") + "</div>").dom()});
		},
		msgbox:function(p){

			require(["popup"],
				function(popup){
					popup.open(p.id||"PopupMsg",
						p.title||"a.info",
						p.msg || _TXT(""),
						[
							{	title:p.ok_label || _S("a.ok"),
								focus:true,
								onclick:function(){
									if(p.onclose){
										p.onclose();
									}
								}
							}
						]
					);
					if(p.onshow){
						p.onshow();
					}
				},
				true
			);
		},

		prompt:function(p){
			var msg = _C("div");
			var txt = _C("textarea",{},p.defaultInput);
			_A( msg, [_HS(_C("div"),p.msg),_C("div",undefined,txt)] );
			p.msg = msg;
			p.onclose=function(){
				if(txt.value.length){
					if(p.okHandler){
						p.okHandler(txt.value);
					}
				}
			};
			require(["popup"],
				function(popup){
					popup.open(p.id||"PopupMsg",
						p.title||"a.questions",
						p.msg || _TXT(""),
						[
							{	title:p.ok_label || _S("a.ok"),
								onclick:function(){
									if(p.onclose){
										p.onclose();
									}
								}
							}
						]
					);
					txt.select();
					txt.focus();
				},
				true
			);
		},

		question:function(p){
			require(["popup"],
				function(popup){
					popup.open(p.id||"confirm",
						p.title,
						p.msg,
						[
							{
								title:p.yes||_S("a.yes"),
								onclick:p.yesHandler
							},
							{
								title:p.no||_S("a.no"),
								onclick:p.noHandler,
								focus:true
							}
						],
						p.floating
					);
				},
				true
			);
		},

		confirm:function( msg, onConfirm, title){
			require(["popup"],
				function(popup){
					popup.open("confirm", title, msg,[
						{
							title:_S("a.yes"),
							onclick:onConfirm
						},
						{
							title:_S("a.no"),
							focus:true
						}
					]);
				},
				true
			);
		},

		askReport:function(info){
			var $ret=$("<div>" + _S("q.question_sent").replace("%m%",info.todays_member_questions).replace("%n%",info.todays_questions) + "</div>");
			return $ret.dom();
		},

		cbox:function(items, onchange, sel){
			var re = _C("select");
			if(_D(onchange)){
				re.onchange=function(){
					onchange(items,this.value);
				};
			}
			$.each(items, function(val, key){
				_HS( _A( re,"option",{value:key} ), val.t );
			});
			if(_D(sel)){
				re.value = sel;
			}
			return re;
		},

		renderVisitation:function(info){
			if( !SSN.id || !this.opGender(info) ) {
				return null;
			}
			var t = $du.createTable(
				{"class":"visit_box",border:"0",width:"100px", cellspacing:"0"},
				[
					{width:"25%", "class":"visitor visit_heart", tipw:300},
					{width:"25%", "class":"visitor visit_counter", tipw:300},
					{width:"25%", "class":"myvisits visit_counter", tipw:300},
					{width:"25%", "class":"myvisits visit_heart", tipw:300}
				]
			);
			if(_N(info.wished)){
				$du.addClass(t.cols[0],"ani_heart_icon");
				_SA( t.cols[0],{tip:"help:profile.wisher"} );
			}else if( _N(info.visits_count)>0 ){
				$du.addClass(t.cols[0],"unk_heart_icon");
				_SA( t.cols[0], {tip: "help:profile.unk_kobool" } );
			}else{
				$du.addClass(t.cols[0],"x_heart_icon");
				_SA( t.cols[0], {tip:"help:profile.no_kobool_chance"} );
			}
			_H(t.cols[1],_N(info.visits_count));
			_H(t.cols[2],_N(info.my_visits));

			if(_N(info.rank)){
				_A( t.cols[3],
					"span",
					{	"class":"btn tahoma rank_btn ani_heart_icon " + (_N(info.visible_wish)?"visible_acceptance":"hidden_acceptance" )
						,tip:"help:profile.in_wishlist", tipw:300
					}
					,info.rank
				).onclick=function(){
					$pgNav.open("list",{ls:"wls",ob:"ra",p:_N((_N(info.rank)-1)/5),ps:5});
				};
			}else{
				$du.addClass(t.cols[3],"x_heart_icon");
				_SA( t.cols[3], {tip:"help:profile.no_kobool", tipw:300} );
			}

			if(info.last_visit||info.my_last_visit){
				var dCols = $du.appendTableRow( t.tbody, [
						{colspan:2,"class":"visitor visit_date"},
						{colspan:2,"class":"myvisits visit_date"}
					]
				);
				if(info.last_visit){
					var d = this.dateToRange(info.last_visit);
					_A( dCols[0], "span", {"class":"item_date " + d.s}, d.t );
				}
				if(info.my_last_visit){
					var d = this.dateToRange(info.my_last_visit);
					_A( dCols[1], "span", {"class":"item_date " + d.s}, d.t );
				}
			}
			t.table.onclick = function(e){
				$du.cancelBubble(e);
			};
			return t.table;
		},

		filterText:function(fid, val, results){
			if( _D(results[fid]) ){
				return results[fid];
			}
			var txt = "";
			var sep = "";
			var aval = val.split("-");
			$.each(aval,function(v){
				txt += sep + _S( "options:sfilters." + fid + ".v" + v ) ;
				sep = " " + _S("a.to") + " ";
			});
			return txt;
		},

		SFilters2String:function( p ){
			var str = "";
			if(!_D(p) ){
				p = {};
			}
			if(!_D(p.query)){
				p.query = $u.paramsHash();
			}
			var froot = this.renderSFiltersRoot(p);
			$.each( froot.childNodes, function(item){
				str += " - " + ( item.innerText || item.textContent );
			});
			return str;
		},

		renderSFilters:function( p ){
			if(!_D(p.query)){
				p.query = $u.paramsHash();
			}
			var root = document.createDocumentFragment();

			var svdSearch = $u.hash2Query($u.searchParams({sum:false,ps:false,p:false,tn:false}));
			if(svdSearch.length){
				_A( root, "span", {"class":"btn fav_off", tip:"help:tips.save_search"}, "&nbsp;" ).onclick=function(){
					if( !module.chkLogin() ){
						return;
					}

					module.question({
						id:"SaveSearchPopup",
						msg:"confirm.save_search",
						yesHandler:function(){
							$http.post({
								scr:$http.api.saveSearch,
								data:{ q:svdSearch },
								refresh:1
							});
						}
					});
				};
			}

			var cPage = _D(p.query) ? p.query.pg : _P("pg");
			var sresults = p.res;
			var backTitle = sresults.total ? ( _S("a.found") + ":" + sresults.total ) : _S("a.back2results");
			_A(root, "span", {"class":"filters_btn view_icon"}, backTitle ).onclick=function(){
				if(cPage=="list"){
					$pgNav.open("drill",{});
				}else{
					$pgNav.open("list",{},["sum","id","mtab","ap","rap","myap","mem"]);
				}
			};

			if( SSN.id ){
				_A( root,
					module.cbox({
							act:{t:"search_lists.act",q:{ob:"rl"}},
							bkm:{t:"search_lists.bkm",q:{ob:"rl"}},
							wls:{t:"search_lists.wls",q:{ob:"ra"}},
							wsr:{t:"search_lists.wsr",q:{ob:"ra"}},
							blk:{t:"search_lists.blk",q:{ob:"rl"}},
							vtr:{t:"search_lists.vtr",q:{ob:"rv"}},
							vtd:{t:"search_lists.vtd",q:{ob:"rv"}},
							nvr:{t:"search_lists.nvr",q:{ob:"rv"}}
						},
						function(items, sel){
							$pgNav.chgParams( $u.clone( items[sel].q, {ls:sel} ),["p"] );
						},
						_D(p.query)?p.query.ls:_P("ls","act")
					)
				);
			};

			_A(root, this.renderSFiltersRoot(p));

			if( ( _P("pg") != "drill" ) || null !== _P("sum") ){
				_A(root, "span", {"class":"filters_btn drill_icon"}, _S("a.add_filter") )
					.onclick=function(){
					$pgNav.open("drill",{},["sum","p"]);
				};
			}

			return root;
		},

		renderSFiltersRoot:function(p){
			var froot = document.createDocumentFragment();
			$.each( module.fids, function(dkey,pi){
				var pval = p.query?p.query[pi]:_P(pi);
				if( _D(pval) && pval!==null && pval != "" ){
					var fbox = _A( froot,"span",{"class":"filter_box"});
					var el = _A( fbox, "span");
					el.onclick=function(e){
						module.toggleFilter(pi);
					};

					module.setAttrText( {el:el, param:pi, prefix:"filters_title." + pi, data:p.query, dkey:pi} );

					_A( fbox, "span", {"class":"del_icon"} )
						.onclick=function(e){
						module.removeFilter(pi);
					};
				}
			});
			return froot;
		},

		dateToRange:function(d){
			if( (typeof (d) !=="string") || (d==="")){
				return {t:"",s:""};
			}
			return this.daysToRangeString( $u.daysSince(d) );
		},

		daysToRangeString:function(tm){
			var txt = _S("a.within").toLowerCase() + " ", d = _N(tm)+1;
			var st;

			if(d<=2){
				txt += _S("a.t.d" + d);st=0;
			}else if(d<7){
				txt += _S("a.t.dx").replace("%", d);st=0;
			}else if(d<=14){
				txt += _S("a.t.w" + ( Math.floor((d-1)/7)+1).toString() );st=1;
			}else if(d<=28){
				txt += _S("a.t.wx").replace("%", ( Math.floor((d-1)/7)+1).toString() );st=1;
			}else if(d<=60){
				txt += _S("a.t.m" + ( Math.floor((d-1)/30)+1).toString() );st=2;
			}else if(d<=90){
				txt += _S("a.t.mx").replace("%", ( Math.floor((d-1)/30)+1).toString() );st=2;
			}else{
				txt = _S("a.t.old");st=3;
			}
			return {t:txt, s:["new","recent","old","past"][st]};
		},

		renderLastLogin:function(info, root){
			var d = this.daysToRangeString( _N(info.last_login) );

			if(!root){
				root = _C("span", {"class":"item_date"});
			}

			_A(root, "span", {'class': d.s }, _S("a.last_login") + ":" + d.t ) ;

			if( _N(info.last_country) ){
				_A( root, _TXT(" >"+_S("a.from")+":") );
				_A( root, _HS( _C("span"), "geo:c.v"+ info.last_country ) );
			}

			return root;
		},

		ageText:function(data){

		},

		setAttrText:function( p ){
			var prefix = (_D(p.prefix)?_S( p.prefix, "" ):"");
			var dkey = p.dkey || this.fids[p.param];
			if( $u.arrFind(["ag","ht","wt"],p.param) ){
				var cYear=(new Date().getFullYear());
				var txt,sep;
				txt=sep="";
				var aval = p.data[dkey].toString().split("-");
				$.each(aval,function(v){
					switch(p.param){
						case "ag":
							txt += sep + (v>1000?(cYear-v):v) ;
							break;
						case "ht":
						case "wt":
							txt += sep + _S("options:sfilters." + p.param + ".v" + v);
					}
					sep = " " + _S("a.to") + " ";
				});
				_H(p.el, prefix + txt);
				return;
			}

			var strID;
			switch(p.param){
				case "o":
				case "c":
					strID = "geo:c.v"+_N(p.data[dkey]);
					break;
				case "st":
					strID = "geo:c"+_N(p.data["country"]||p.data["c"])+".v"+_N(p.data[dkey]);
					break;
				case "ci":
					strID = "geo:c"+_N(p.data["country"]||p.data["c"])+"_"+_N(p.data["state"]||p.data["st"])+".v"+_N(p.data[dkey]);
					break;
				default:
					strID = "options:sfilters." + p.param + ".v" + p.data[dkey];
			}

			_HS(p.el, strID, function(str){
				return (_D(p.prefix)?_S( p.prefix, "" ):"") + str;
			});
		},

		renderAttr:function(root, info, attrList, opt){
			$.each( attrList, function(dkey, param){
				if(_D(info[dkey])){
					_HSEP(root);
					var el = _A( root,"span", {'class':"inline attr"} );
					if(! ( opt && !opt.href ) ){
						$du.addClass(el,"href");
						el.onclick=function(e){
							module.toggleFilter(param, dkey, info);
						};
					}
					module.setAttrText( {el:el, param:param, prefix:"filters_title." + param, data:info, dkey:dkey} );
				}
			});
		},

		renderNav:function( res, gotoPage, reverse ){
			var t  = _N(res.total)||_N(res.count);
			var ps = _N(res.page_size)||_N(res.ps)||5;
			var pg = _N(res.page) || _N(res.p);
			var pc = Math.floor((t-1)/ps)+1;

			var nav = _C("div",{"class":"nav_root"});

			if( !_D(gotoPage) ){
				gotoPage = function(pg){
					$pgNav.chgParams({p:pg},undefined,true);
				};
			}

			_A( nav, _C("span",{"class":"href"}, _S("a.total")+ ": " + t )	).onclick=function(){
				gotoPage(pg);
			};

			if( t<=ps ){
				return nav;
			}

			_A( nav,_TXT(" ")) ;

			if( pg>0 ){
				_A(nav,"span",{"class":"pg_nav_btn btn_prev"},"&lt;").onclick=function(e){
					gotoPage(pg-1);
				};
			}

			var pds = function(p){
				return ( reverse ? (pc-p):(p+1) ).toString();
			};
			var pcount = 5;

			var start = pg - pg%(pcount-1);

			//if( start>2 ){// write the first page button
			//	var p=0;
			//	_A(nav,"span",{"class":"pg_nav_btn btn_pg" + (p==pg?" btn_active" : "")},
			//		pds(p)
			//	).onclick= function(e){ gotoPage( 0 ); };
			//	_A(nav,_TXT("..."));
			//};
			//// write curr group buttons
			//for(p=start-(start>0?1:0);p<pc&(p-start)<pcount;p++){
			//	_A(nav,"span",{"class":"pg_nav_btn btn_pg" + (p==pg?" btn_active" : ""),"pg":p},
			//		pds(p)
			//	).onclick= function(e){ gotoPage( this.getAttribute("pg") ); };
			//}
			//
			//if(p<pc-1){
			//	_A(nav,_TXT("..."));
			//	_A(nav,"span",{"class":"pg_nav_btn btn_pg"}, pds(pc-1)
			//	).onclick=function(e){
			//		gotoPage(pc-1);
			//	};
			//}
			_A( nav,"span",{"class":"pg_nav_btn btn_pg" ,"pg":pg}, pds(pg) );

			if(pg<pc-1){
				_A(nav,"span",{"class":"pg_nav_btn btn_next"}, "&nbsp;" + (reverse?_S("a.previous"):_S("a.next")) + " &gt;&nbsp;"
				).onclick=function(e){
					gotoPage(pg+1);
				};
			}
			return nav;
		},

		getProgress:function(){
			return _C("div",{"class":"progress"});
		},

		blockedEl:function(el){
			if( (el=_E(el)) ){
				$du.blockPr(el);
				return el;
			}else{
				return this.getProgress();
			}
		},

		toggleFilter:function(fid,fkey,info,page){
			if( null !== _P(fid) ){
				var pRem = [];
				switch(fid){
					case "c":
						pRem.push("st");
					case "st":
						pRem.push("ci");
				}
				$pgNav.open("drill",{sum:fid},pRem);
			}else{
				this.openFilter(fid,fkey,info,page);
			}
		},

		openFilter:function(fid,fkey,info,page){
			var pAdd = {};
			switch(fid){
				case "ag":
					pAdd[fid]=(_N(info.birth_year)-2).toString() + "-" + (_N(info.birth_year)+3);
					break;
				case "ci":
					pAdd.st=info.state;
				case "st":
					pAdd.c=info.country;
				default:
					pAdd[fid]=info[fkey];
			}
			if(!_D(page)){
				var cPg = _P("pg");
				switch(cPg){
					case "drill":
						page = cPg;
						break;
					default:
						page = "list";
				}
			}
			$pgNav.open(page, pAdd, ["p", "id", "mtab","ap","rap","myap","mem"]);
		},

		removeFilter:function(fid, page){
			var pRemove = [fid,"p"];
			switch(fid){
				case "c":
					pRemove.push("st");
				case "st":
					pRemove.push("ci");
			}
			if(!_D(page)){
				var cPg = _P("pg");
				switch(cPg){
					case "drill":
						page = cPg;
						break;
					default:
						page = "list";
				}
			}
			$pgNav.open(page,{}, pRemove, true);
		},
		myAnswerClass:function(info){
			return ( _D(info.approved) ? {"0":" und_review", "1":"", "2":" rejected_text"}[info.approved] : "" );
		}


	};
});