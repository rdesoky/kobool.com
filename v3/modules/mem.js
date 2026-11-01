/**
 * Created by rdeso_000 on 1/6/2015.
 */
define(["jquery","kui","http","k-template","utils","dom-utils","tab-ctrl","page-nav","top-tabs"], function($,kui,http,tmpl,$u, $du,JCTabCtrl,pgNav,$tabs){
	var module;
	return module = {
		requireCSS:["mem"],
		requireStrings:["str:filters","options:sfilters","str:filters_title","str:q", "str:m", "qa:ui"],
		onload:function(){

			var $root = $("#Contents");

			var $view_root = $("#MemViewPanel", $root).html("<div class='progress'/>");

			this.memID = _N( _P( "mem", _GC("id",0) ) );

			if( !this.memID ){
				if( !kui.chkLogin({nav:true}) ){
					return;
				}
			}
			if( this.memID == _N(_GC("id",0)) ){
				$tabs.showTab("Menu.Profile");
			}else{
				$tabs.select(null);
			}

			return http.getCGI( http.api.member, {mem:this.memID} )
				.then( function(r){
					var response = r.responseText;
					var results = JSN(response);

					if(results.error){
						$view_root.html( "Error:" + _S(results.error) );
					}else{
						$view_root.html("");
						if( _N(results.success) ){
							var info = module.info = results;
							document.title = _S("a.kobool") + " - " + _S("a.pg_title.mem") + ": " + info.login_id;
							try {
								tmpl.render({
									tid:".mem_profile",
									data:info,
									$root:$view_root
								}).done(function(){
									$("#ProfileID").html(info.login_id);
									module.recordVisit(info);
								});
							}catch(e){
								$view_root.html(e.message);
							}
						}
					}
				});
		},
		onchange:function(bRefresh){
			if(bRefresh || this.memID!=_P("mem",SSN.id)){
				this.onload();
				return;
			}

			var navTab = $u.getCParam("mtab","TText");
			if(this.memTab && navTab!=this.memTab.selTab){
				this.showActiveTab();
			}
		},
		recordVisit:function(info){
			if( _GC("sid") && info.activated == "1" && kui.opGender(info) ){//record visitation
				setTimeout( function(){
						if( $u.getPageID() == "mem" && _P("mem",SSN.id) == info.id ){
							http.post({scr:http.api.visit, silent:true, data:{id:info.id}});
						}
					},
					10000
				);
			}
		},
		onTab:function( id, firstShow ){
			if($u.getCParam("mtab","TText")!=id){
				pgNav.chgParams({mtab:id}, undefined, false, true);
			}
			switch(id){
				case "TAnswers":
					module.onShowQA("MAnswers", http.api.mem_qa, "ap", {});
					break;
				case "TNewQ":
					module.onShowQA("MNewQ", http.api.my_new_q, "rq", {});
					break;
				case "TPstpQ":
					module.onShowQA("MPstpQ", http.api.my_new_q, "pq", {d:1});
					break;
				case "TRelAnswers":
					module.onShowQA("MRelAnswers", http.api.relevant_ans, "rap", {});
					break;
				case "TAnswers4U":
					module.onShowQA("MAnswers4U", http.api.answers4u, "myap", {});
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
			if( active_id == this.memID ){
				return true;
			}
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
			_A(pics_panel, kui.getProgress());

			http.getCGI(http.api.pics, {id: this.memID },
				function(t,x){
					var res = x ? http.xml2JS(x) : JSN(t);
					_CL(pics_panel);
					var tn_frame = _AD(pics_panel,{"class":"tn_frame"});
					var pic_frame = _AD(pics_panel,{"class":"pic_frame"});
					//var sel = new CSelector();
					$.each(res.child_list, function(item){
						var img = _A(tn_frame,"img",{"class":"tn_frame_pic", "src":http.picSRC(item.id,module.info.gender,true)});
						//$u.disableSelection(img);
						img.onclick=function(){
							//sel.select(this);
							$du.selectSibling(this);
							_CL(pic_frame);
							var pr = _A(pic_frame, kui.getProgress());
							var full_img = _A(pic_frame, "img",{"src":http.picSRC(item.id,module.info.gender)} );
							//$u.disableSelection(full_img);
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
			if( this.isRendered(panelID,true) ){
				return;
			}

			var memid = this.memID;

			if(!cgi_params){
				cgi_params = {};
			}
			cgi_params.id = cgi_params.to = memid;
			cgi_params.ps = 10;

			function invalidateTabs(){//TODO: not called
				$.each(["MAnswers", "MNewQ","MPstpQ","MRelAnswers", "MAnswers4U"], function(pid){
					if(pid!=panelID){
						_SA(pid,{memid:memid});//invalidate other tab panels
					}
				});
			}

			var $root = $("#" + panelID).html("<div class='progress'/>");

			function getPage(nPage){
				var $docFrag = $(document.createDocumentFragment());
				var results;

				cgi_params.p = nPage;

				var tid = ".mem_answer";
				var memid = _P( "mem", _GC("id", 0) );
				if(memid == _GC("id", 0)){
					tid = ".my_answer";
				}

				return http.getCGI( cgi, cgi_params )
					.then( function(r){
						results = JSN(r.responseText);
						return tmpl.render({
							data:results.child_list || [],
							tid:tid,
							$root:$docFrag,
							puller:function(){
								return getPage(nPage+1);
							}
						});
					}).then(function(){
						return {
							$docFrag: $docFrag,
							results: results
						}
					});
			}
			getPage(0).done(function(pageInfo){
				$("#" + panelID + "_count").html(pageInfo.results.total);
				if(pageInfo.results.total == 0){
					$root.html("<div class='subtitle'>" + _S("a.no_results") + "</div>");
				}else{
					$root.html("").append(pageInfo.$docFrag);
				}

			});
		},

		initTabs:function(root, $d){// invoked from template
			$(".ctab",root).click(function(e){
				module.onTabClick(e.currentTarget,root);
			});
			module.memTab = new JCTabCtrl(
				{	TText:"MText"
					,TAnswers:"MAnswers"
					,TNewQ:"MNewQ"
					,TPstpQ:"MPstpQ"
					,TPictures:"MPictures"
					,TRelAnswers:"MRelAnswers"
					,TAnswers4U:"MAnswers4U"
					//,TAsk:"MAsk"
				},
				1// 1: switch by click; 0: switch by hover
			);
			module.showActiveTab(root);

		},

		showActiveTab:function(root){
			root = root || $("#Contents").dom();
			$du.waitFor$("#MTabs.tabs").done(function(){
				var active_tab = $u.getCParam("mtab","TText");
				var active_tab_el = $( "#" + active_tab , root).dom();
				if(!active_tab_el){
					active_tab_el = $( "#TText", root ).dom();
				}
				module.onTabClick(active_tab_el, root);
			});
		},

		onTabClick:function(el,root){
			if(!el){
				return;
			}
			var id = el.id;
			module.onTab(el.id);
			$du.selectChild(root, el, ".ctab", "seltab");
			var tabs_root = $(".tabs_root",root).dom();
			$du.selectChild(
				tabs_root,
				$("." + el.id,tabs_root).dom(),
				".tab_panel", "seltab"
			);
		}
	}
});