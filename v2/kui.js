var KUI = {
	fids:{g:"gender",ag:"age",ms:"marital_status",ch:"children",c:"country",st:"state",ci:"city",o:"origin_country",ht:"height",wt:"body",jb:"job",nc:"income",la:"language",rc:"race",ed:"education",sm:"smoker",re:"religion",ds:"disability",dt:"dress_type",sh:"shape",fc:"facelook",dst:"district",po:"polygamy"},
	
	genderIcon:function(info,opt){
		var btn = _C( "span", {"class":"flat_btn gender_" + info.gender + "_icon"});
		if(!(opt&&!opt.href)){
			DU.addClass(btn,"href");
			btn.onclick=function(){
				KUI.toggleFilter("g","gender", info);
			};
		}
		return btn;
	},
	memTooltip:function(memID){
		var ret = _C("div",{},KUI.getProgress());
		Http.getCGI(gCGI.member,{mem:memID},function(res){
			RSCR("MemVUR.vw10",function(){
				var r=JSN(res);
				_A(_CL(ret),MemVUR.vw10.render( r ));
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
			DU.addClass(btn,"icon");
			_H(btn,_S("a.block"));
		}else{
			DU.addClass(btn,"btn");
		}
		
		btn.onclick=function(e){
			RSCR("KActions",function(){
				KActions.onclickBlock(info, btn, onfinish);
			});
		};
		return btn;
	},
	bookmarkBtn:function(info){
		var btn, on = _N(info.bookmark);
		btn = _C( "span", {'class':"btn " + (on?"fav_on":"fav_off"), tip:"help:tips." + (on?"unbookmark":"bookmark")} );
		btn.onclick=function(){
			RSCR("KActions",function(){ KActions.onclickBookmark(info, btn);} );
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
			var msg = _AD( _CL("Contents") );
			_A( msg, this.getProgress() );
			setTimeout(
				function(){
					_A( _CL(msg), KUI.loginMSG() );
				},
				1000
			);
			try{
				document.forms.login.lname.focus();
			}catch(e){
				
			}
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
		Req("popup", function(){
			var editor = _C("textarea",{"class":"std_textarea"}, oldText || "");
			
			Popup.open("TextEditor", title, editor,[
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
	msgbox:function(p){

		Req("popup",
			function(){
				Popup.open(p.id||"PopupMsg", 
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
		_A( msg, [_HS(_C("div"),p.msg),_C("div",undef,txt)] );
		p.msg = msg;
		p.onclose=function(){
			if(txt.value.length){
				if(p.okHandler){
					p.okHandler(txt.value);
				}
			}
		};
		Req("popup",
			function(){
				Popup.open(p.id||"PopupMsg", 
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
		Req("popup",
			function(){
				Popup.open(p.id||"confirm", 
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
		Req("popup",
			function(){
				Popup.open("confirm", title, msg,[
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
		var r = _C("div");
		_A(	r, 
			"div",
			undef, 
			_S("q.question_sent").replace("%m%",info.todays_member_questions).replace("%n%",info.todays_questions) 
		);
		return r;
	},
	cbox:function(items, onchange, sel){
		var re = _C("select");
		if(_D(onchange)){
			re.onchange=function(){
				onchange(items,this.value);
			};
		}
		Enum(items, function(val, key){
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
		var t = DU.createTable(
			{"class":"visit_box",border:"0",width:"100px", cellspacing:"0"},
			[
				{width:"25%", "class":"visitor visit_heart", tipw:300},
				{width:"25%", "class":"visitor visit_counter", tipw:300},
				{width:"25%", "class":"myvisits visit_counter", tipw:300},
				{width:"25%", "class":"myvisits visit_heart", tipw:300}
			]
		);
		if(_N(info.wished)){
			DU.addClass(t.cols[0],"ani_heart_icon");
			_SA( t.cols[0],{tip:"help:profile.wisher"} );
		}else if( _N(info.visits_count)>0 ){
			DU.addClass(t.cols[0],"unk_heart_icon");
			_SA( t.cols[0], {tip: "help:profile.unk_kobool" } );
		}else{
			DU.addClass(t.cols[0],"x_heart_icon");
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
				PgNav.open("list",{ls:"wls",ob:"ra",p:_N((_N(info.rank)-1)/5),ps:5});
			};
		}else{
			DU.addClass(t.cols[3],"x_heart_icon");
			_SA( t.cols[3], {tip:"help:profile.no_kobool", tipw:300} );
		}

		if(info.last_visit||info.my_last_visit){
			var dCols = DU.appendTableRow( t.tbody, [
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
			DU.cancelBubble(e);
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
		Enum(aval,function(v){
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
			p.query = PgNav.paramsHash();
		}
		var froot = this.renderSFiltersRoot(p);
		Enum( froot.childNodes, function(item){
			str += " - " + ( item.innerText || item.textContent );
		});
		return str;
	},
	renderSFilters:function( p ){
		if(!_D(p.query)){
			p.query = PgNav.paramsHash();
		}
		var root = _C("div");

		var svdSearch = PgNav.hash2Query(PgNav.searchParams({sum:false,ps:false,p:false,tn:false}));
		if(svdSearch.length){
			_A( root, "span", {"class":"btn fav_off", tip:"help:tips.save_search"} ).onclick=function(){
				if( !KUI.chkLogin() ){
					return;
				}

				KUI.question({
					id:"SaveSearchPopup",
					msg:"confirm.save_search", 
					yesHandler:function(){
						Http.post({
							scr:"save_query.pl",
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
				PgNav.open("drill",{});
			}else{
				PgNav.open("list",{},["sum","id","mtab","ap","rap","myap","mem"]);
			}
		};

		if( SSN.id ){
			_A( root, 
				KUI.cbox({
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
						PgNav.chgParams( U.clone( items[sel].q, {ls:sel} ),["p"] );
					},
					_D(p.query)?p.query.ls:_P("ls","act")
				)
			);
		};

		_A(root, this.renderSFiltersRoot(p));

		if( ( _P("pg") != "drill" ) || null !== _P("sum") ){
			_A(root, "span", {"class":"filters_btn drill_icon"}, _S("a.add_filter") )
			.onclick=function(){
				PgNav.open("drill",{},["sum","p"]);
			};
		}

		return root;
	},
	renderSFiltersRoot:function(p){
		var froot = _C("span");
		Enum( KUI.fids, function(dkey,pi){
			var pval = p.query?p.query[pi]:_P(pi);
			if( _D(pval) && pval!==null && pval != "" ){
				var fbox = _A( froot,"span",{"class":"filter_box"});
				var el = _A( fbox, "span", {"class":"href"});
				el.onclick=function(e){
					KUI.toggleFilter(pi);
				};

				KUI.setAttrText( {el:el, param:pi, prefix:"filters_title." + pi, data:p.query, dkey:pi} );

				_A( fbox, "span", {"class":"del_icon"} )
				.onclick=function(e){
					KUI.removeFilter(pi);
				};
			}
		});
		return froot;
	},
	dateToRange:function(d){
		return this.daysToRangeString( U.daysSince(d) );
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
	setAttrText:function( p ){
		var prefix = (_D(p.prefix)?_S( p.prefix, "" ):"");
		var dkey = p.dkey || this.fids[p.param];
		if( U.arrFind(["ag","ht","wt"],p.param) ){
			var cYear=(new Date().getFullYear());
			var txt,sep;
			txt=sep="";
			var aval = p.data[dkey].toString().split("-");
			Enum(aval,function(v){
				switch(p.param){
					case "ag":
						txt += sep + (v>1000?(cYear-v):v) ;
						break;;
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
		Enum( attrList, function(dkey, param){
			if(_D(info[dkey])){
				_HSEP(root);
				var el = _A( root,"span", {'class':"inline attr"} );
				if(! ( opt && !opt.href ) ){
					DU.addClass(el,"href");
					el.onclick=function(e){
						KUI.toggleFilter(param, dkey, info);
					};
				}
				KUI.setAttrText( {el:el, param:param, prefix:"filters_title." + param, data:info, dkey:dkey} );
			}
		});
	},
	
	renderNav:function( res, gotoPage, reverse ){
		var t  = _N(res.total)||_N(res.count);
		var ps = _N(res.page_size)||_N(res.ps)||5;
		var pg = _N(res.page) || _N(res.p);
		var pc = Math.floor((t-1)/ps)+1;

		var nav = _C("div",{"class":"nav_root"});
		
		_A( nav, _C("span",{"class":"href"}, _S("a.total")+ ": " + t )	).onclick=function(){
			gotoPage(pg);
		};

		if( !_D(gotoPage) ){
			gotoPage = function(pg){ PgNav.chgParams({p:pg},undef,true); };
		}

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

		if( start>2 ){
			var p=0;
			_A(nav,"span",{"class":"pg_nav_btn btn_pg" + (p==pg?" btn_active" : "")},
				pds(p)
			).onclick= function(e){ gotoPage( 0 ); };
			_A(nav,_TXT("..."));
		};

		for(p=start-(start>0?1:0);p<pc&(p-start)<pcount;p++){
			_A(nav,"span",{"class":"pg_nav_btn btn_pg" + (p==pg?" btn_active" : ""),"pg":p},
				pds(p)
			).onclick= function(e){ gotoPage( this.getAttribute("pg") ); };
		}

		if(p<pc-1){
			_A(nav,_TXT("..."));
			_A(nav,"span",{"class":"pg_nav_btn btn_pg"}, pds(pc-1)
			).onclick=function(e){
				gotoPage(pc-1);
			};
		}

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
			DU.blockPr(el);
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
			PgNav.open("drill",{sum:fid},pRem);
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
		PgNav.open(page, pAdd, ["p", "id", "mtab","ap","rap","myap","mem"]);
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
		PgNav.open(page,{}, pRemove, true);
	}
};

var Feedback = {
	drawBtn:function( vwr, info ){
		if(!KUI.opGender(info)){
			return undefined;
		}
		var el = _C("span", {'class':"btn edit_icon", tip:"help:personal_note.btn_tip"});
		el.onclick=function(){
			Feedback.onEdit( vwr, info );
		};
		return el;
	},
	onDelete:function(r, info){
		KUI.confirm( "a.sure", function(){
			Http.postUpdate(
				gCGI.upd_feedback, 
				{id:info.id, text:""},
				function(res){
					delete info.feedback;
					delete info.feedback_date;
					Feedback.update(r,info);
				}
			);
		});
	},
	onEdit:function(r, info){
		if(!KUI.chkLogin()){
			return;
		}
		Req("popup", function(){
			var editor = _C("textarea",undef, info.feedback || "");
			var title = _HS(_C("span"), "help:personal_note.popup_title", function(s){
				return s.replace("%m%", info.login_id);
			});
			Popup.open("FeedbackEditor", title, editor,[
				{
					title:_S("a.save"),
					onclick:function(){
						var pr = DU.replace(r, KUI.getProgress());
						Http.post({
							scr:gCGI.upd_feedback, 
							silent:1,
							data:{id:info.id, text:editor.value},
							onload:function(res){
								DU.replace(pr, r);
								info.feedback=editor.value;
								info.feedback_date = "";
								Feedback.update(r,info);
							}
						});
					}
				},
				{
					title:_S("a.cancel")
				}
			]);
			editor.focus();
		});

	},
	draw:function(info){
		var r = _C( "div" );
		this.update(r, info);
		return r;
	},
	update:function(r, info){
		_CL(r);
		DU.removeClass(r, "feedback");
		if( info.feedback ){
			DU.addClass(r, "feedback");
			_A( r,"div", {}, info.feedback.replace(/\n/g,"<br/>") );
			var tbar = _A( r,"div", {"class":"tmargin small footer_bar"} );

			if(info.feedback_date){
				_A( tbar, "span", {"class":"item_date"}, info.feedback_date );
			}
			
			_HSEP(tbar);
			_HS( _A( tbar, "a", {href:"#"} ), "sbtn.edit" ).onclick=function(){
				Feedback.onEdit(r, info);
				return false;
			};
			_HSEP(tbar);
			_HS( _A( tbar, "a", {href:"#"} ), "sbtn.delete" ).onclick=function(){
				Feedback.onDelete(r, info);
				return false;
			};
		}
	}
};

var CCheckFrame = {
	render:function(attr){
		this.dom = _C("div", attr || {"class":"radio_frame"});
		this.dom.onclick = function(e){
			var target = e ? e.target : event.srcElement;
			if(target!=this.firstChild){
				this.firstChild.focus();
				this.firstChild.click();
			}
		};
		return this.dom;
	}
};
CCheckFrame = DefineJClass( CCheckFrame );

