/**
 * Created by rdeso_000 on 1/7/2015.
 */

define(["jquery", "kui","page-nav","utils","http","top-tabs","k-template"],function($,$kui,$pgNav,$u,$http,$tabs,$ktmpl){
	var module;
	return module = {
		requireStrings:["str:m","str:profile"],
		onload:function(dom){
			if( !SSN.id ){
				$pgNav.open("home");
				return;
			}
			$tabs.showTab(null);
			$tabs.select("Menu.home");
			$pgNav.scrollTop();

			this.renderStats(dom);
			this.renderUpdates(dom);
			this.renderActivities(dom);
			this.renderAnswers(dom);
			this.renderSavedSearches(dom);
		},

		renderStats:function(dom){
			var data = [
				{key: "questions", href: "#pg=mem&mtab=TNewQ", icon:"question-sign"},
				{key: "visitors", href: "#pg=list&ls=vtr&ob=rv", icon:(SSN.gender==1) ? "male":"female"},
			];
			if(_N(SSN.mate)==0){
				data.push({key: "wishers", href: "#pg=list&ls=wsr&ob=ra", icon:"heart"});
				data.push({key: "declines", href: "#pg=declines", icon:"heart-empty"});
			}
			$ktmpl.render({
				data: data,
				tid:".stats_button",
				$root:$("#Stats", dom)
			});
		},
		renderUpdates:function(dom){
			var data= [
				{key:"upd_attr", title:"update_attr",icon:"user"},
				{key:"upd_txt",	title:"update_text",icon:"edit"},
				{key:"upd_pics",title:"update_pics",icon:"camera"},
				{key:"upd_pass", title:"update_pass",icon:"key"},
				{key:"upd_email", title:"update_email",icon:"envelope"}
			];
			if(SSN.activated){
				data.push({key:"acc_suspend", title:"stop_account",icon:"moon"});
			}else{
				data.push({key:"acc_activate", title:"activate_account",icon:"sun"});
			}

			$ktmpl.render({
				data: data,
				tid:".update_btn",
				$root:$("#Update", dom)
			});

		},
		renderActivities:function(dom){
			var data= [
				{title:"search_lists.wls",	icon:"heart", href:"#pg=list&ls=wls&ob=ra"},
				{title:"search_lists.bkm",	icon:"star", href:"#pg=list&ls=bkm&ob=rl"},
				{title:"search_lists.vtd",		icon:"eye-open", href:"#pg=list&ls=vtd&ob=rv"},
				{title:"search_lists.blk",		icon:"ban-circle", href:"#pg=list&ls=blk&ob=rl"}
			];

			$ktmpl.render({
				data: data,
				tid:".link_button",
				$root:$("#Activities", dom)
			});
		},
		renderAnswers:function(dom){
			$http.getCGI($http.api.search_ans,{
				ls:"myq",
				ps:5
			}).done(function(res){
				var data = JSN(res.responseText).child_list;
				if(data && data.length){
					var $listRoot = $("#RecentAnswers", dom);
					$("#AnswersTitle",dom).show();
					$ktmpl.render({
						tid: ".answer_simple_result",
						data: data,
						$root: $listRoot
					}).done(function(){
						$listRoot.append("<div><a href='#pg=qa&ls=myq' class=button>" + _S("a.browse") + "</div>");
					});
				}
			});
		},
		renderSavedSearches:function(dom){
			require(["saved-search"],function(savedSearch){
				$("#SearchList",dom).append( savedSearch.render() );
			});
		}
	};
});
