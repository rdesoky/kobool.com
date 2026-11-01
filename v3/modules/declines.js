define(["jquery","top-tabs","kui","http","page-nav","utils"],function($,$tabs,$kui,$http,$pgNav,$u){
	var module;
	return module = {
		requireCSS:["list"],
		requireStrings:["str:declines"],
		onload:function(){
			if (!$kui.chkLogin({nav: true})) {
				return;
			}
			$tabs.select("Stats.Declines");
			this.onchange();
		},
		onchange:function(){
			var pr = _R( $kui.blockedEl("PageRoot") );
			var root = _A( _CL("Contents"), "div", {}, pr );
			$http.getCGI($http.api.declines, {p:_P("p",0)}, function(t,x){
				_CL(root);//remove progress
				_SA(root,{id:"PageRoot"});
				var r=$http.xml2JS(x);
				if(r.error){
					$kui.msgbox("errors:error." + r.error);
				}else{
					_A(root,"div",{"class":"pg_header title"}, _S("declines.page_title") + ":" + r.total );

					var listDOM = _A(root,"div",{"class":"pg_body", ls:"declines"});
					module.renderPage(r,listDOM);
					_A(listDOM, $kui.renderNav(r));
				}

			});
		},
		renderPage:function(r, root){
			_CL(root);
			$.each(r.child_list, function(child){
				_A( root, module.renderItem(child) );
			});

		},

		renderItem:function(item){
			var clickSelf=function(){
				$pgNav.open("mem",{mem:SSN.id},true);
			};
			var clickMatch=function(){
				if(_N(item.activated)){
					$pgNav.open("mem",{mem:item.id},true);
				}else{
					$kui.msgbox({msg:"declines.inactive"});
				}
			};
			var root = _C( "div", {"class":"sresult_root decline_item"} );
			_A( root,"center",{"class":"bold"}, _S("declines.date_matched") + item.date_matched );
			var tbl = _AT( root,{},[{},{"class":"right_align"}]);
			_A( tbl.cols[0], "div", {"class":"login_id"}, _S("a.you") ).onclick=clickSelf;
			_A(_A(tbl.cols[0], "div",{"class":"pic50frame float_left"}),"img",{src:$http.picSRC(SSN.main_pic, SSN.gender, true)}).onclick=clickSelf;
			_A( tbl.cols[1], "div", {"class":"login_id"}, item.login_id ).onclick = clickMatch;
			var img = _A( _A(tbl.cols[1],"div",{"class":"pic50frame float_right"}), "img",{src:$http.picSRC(item.main_pic, item.gender, true)});
			img.onclick=clickMatch;
			$u.disableSelection(img);
			var note = _A( tbl.cols[_N(item.who_declined)],"div",{"class":"note"}, _S("declines.date_declined") + item.date_declined );
			_A( note,"div",{"class":"tahoma left_align"}, item.decline_msg );

			return root;
		}
	};
});
