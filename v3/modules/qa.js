/**
 * Created by rdeso_000 on 1/7/2015.
 */
define(["jquery","page-nav", "kui","k-template","http","utils","top-tabs","js-promise","qui"],
	function($, pgNav, kui,tmpl, $http, $u, $tabs, Promise, $qui){

	var module;
	
	return module = {
		requireCSS:["list"],
		requireStrings:["str:sfilters","str:filters_title","qa:ui"],

		onload:function(){
			this.onchange();
		},
		onchange:function(){
			pgNav.scrollTop();

			var phash = $u.paramsHash( {g:(SSN.id?SSN.gender:false)} );

			switch(phash.ls){
				case "bkm":
				case "wls":
				case "myq":
					if(!kui.chkLogin({nav:true})){
						return;
					}
					break;
			}

			if(SSN.id){
				$tabs.showTab("Menu.QA");
				$tabs.select("QA.answers");

				$("#QASortBar").html("").append( this.filterBar(phash) );
			}else{
				$tabs.select("GuestMenu.qa");
			}
			var $total = $("#SearchTotal");
			var $header = $("#PageActions");
			var $root = $("#QAnswers").html("").html("<div class='progress'/>");

			this.getPage(0).done(function(pageInfo){
				//$total.html(pageInfo.results.total);
				$root.html("");
				if(_N(pageInfo.results.total)){
					$root.append(pageInfo.$docFrag);
				}else{
					$root.append('<div class="pg_body title">' + _S("a.no_results") + '</div>')
				}

				tmpl.render({
					tid:"#QAHeader",
					data:pageInfo.results,
					clear:true,
					$root: $header
				});
			});
		},

		getPage:function(page){
			var $docFrag = $(document.createDocumentFragment());
			var results;
			var p =  $u.paramsHash( {
				g:(SSN.id?SSN.gender:false)
			} );

			return $http.getCGI( $http.api.search_ans, {qid:p.qid, p:page, ls:p.ls, ps:10, g:p.g})
				.then( function(res){
					results=JSN(res.responseText);

					if(_N(results.total)){
						return tmpl.render({
							tid: ".answer_result",
							data: results.child_list || [],
							$root: $docFrag,
							ordinal: page * 10 + 1,
							puller:function(info){
								return module.getPage(page+1)
							}
						});
					}
					else {
						$docFrag.html('<html class="pg_body title">' + _S("a.no_results") + '</div>');
						return Promise.as($docFrag);
					}
				}).then(function(){
					return {
						$docFrag: $docFrag,
						results: results
					}
				});

		},

		openBrowser:function(){

			require(["popup","qui"], function(popup, qui){
				var clickHandler = function(row, cinfo){
					pgNav.open("qa", {qid:row.question},["p"]);
					popup.close("QAViewer");
				};
				var popupClient = popup.open(
					"QAViewer",
					undefined,
					undefined,
					undefined,
					true
				);

				function showPage(page) {
					var $docFrag = $(document.createDocumentFragment());
					var results;

					return $http.getCGI( $http.api.qlist, {p:page,g:(SSN.id ? (SSN.gender?0:1):-1 )}
						).then(function (r) {
							results = r.responseXML ? $http.xml2JS(r.responseXML): JSN(r.responseText);
							return tmpl.render({
								data: results.child_list,
								$root: $docFrag,
								tid: ".browse_question",
								scrollRoot: popupClient,
								puller: function () {
									return showPage(page + 1);
								}
							});
						}).then(function(){
							return {
								results: results,
								$docFrag: $docFrag
							};
						});
				}
				showPage(0).done(function(pageInfo){
					$(popupClient).append(pageInfo.$docFrag);
				});
			});
		},

		filterBar:function(q){
			if(!SSN.id){
				return $();
			}
			var $ret = $('<div class="sort_bar dock_item"></div>');

			var items = ["myq","bkm","wls","act"];

			var act = q.ls || _P("ls","act");

			$.each(items, function(val){
				var $btn = $('<span class="sort_btn">' + _S("qa:ui.filters." + val) + '</span>');
				if(val == act){
					$btn.addClass("sel");
				}
				$ret.append($btn);
				$btn.click(function(){
					pgNav.chgParams({ls:val},["p"],true,true);
				});
			});
			return $ret;
		},
		initHeader:function(dom){
			$("button, .qtitle_text",dom).click(function(){
				$qui.browseQuestions();
			});

			$(".delete",dom).click(function(){
				pgNav.chgParams(undefined,['qid']);
			})
		}
	}; 	
});


