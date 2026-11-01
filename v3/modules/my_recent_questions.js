/**
 * Created by rdeso_000 on 1/13/2015.
 */

define(["jquery", "kui", "http", "page-nav", "utils", "qui","top-tabs","k-template","qa"],function($, $kui, $http, $pgNav, $u, $qui, $tabs, $tmpl, $qa){
	var module;
	return module = {
		requireStrings:["str:qa_menu"],
		requireCSS:["list"],
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}
			$tabs.showTab("Menu.QA");
			$tabs.select("QA.my_recent_questions");

			this.onchange();
		},

		onchange: function () {
			$pgNav.scrollTop();
			var $total = $("#SearchTotal");
			var $header = $("#PgHeader");
			var $root = $("#QAnswers").html("").html("<div class='progress'/>");
			this.getPage(0).done(function(pageInfo){
				$total.html(pageInfo.results.total);
				$root.html("");
				if(_N(pageInfo.results.total)){
					$root.append(pageInfo.$docFrag);
				}else{
					$root.append('<div class="pg_body title">' + _S("a.no_results") + '</div>')
				}
				$tmpl.render({
					tid:"#MyQAHeader",
					data:pageInfo.results,
					clear:true,
					$root: $header
				});

			});

		},

		getPage:function(page){// return page fragment
			var $docFrag = $(document.createDocumentFragment());
			var results;
			var p =  $u.paramsHash( {p:page, ps:10} );

			return $http.getCGI( $http.api.my_recent_q, p)
				.then( function(res){
					results=JSN(res.responseText);

					if(_N(results.total)){
						return $tmpl.render({
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
		initHeader:function(dom, $d){
			$("#q_by_member",dom).click(function(e){
				require(['my_q_by_member'],function(o){
					o.openBrowser();
				});
			});
			$(".qtitle_text",dom).click(function(){
				$qui.browseQuestions();
			});

			$(".delete",dom).click(function(){
				$pgNav.chgParams(undefined,['qid']);
			})
		}

	}
});