var Declines = {
	onload:function(){
		TopTabs.select("Stats.Declines");
		this.onchange();
	},
	onchange:function(){
		var pr = _R( KUI.blockedEl("PageRoot") );
		var root = _A( _CL("Contents"), "div", {}, pr );
		Http.getCGI(gCGI.declines, {p:_P("p",0)}, function(t,x){
			_H("Debug",t);
			_CL(root);//remove progress
			_SA(root,{id:"PageRoot"});
			var r=Http.xml2JS(x);
			if(r.error){
				KUI.msgbox("errors:error." + r.error);
			}else{
				_A(root,"div",{"class":"pg_header title"}, _S("declines.page_title") + ":" + r.total );
				
				var listDOM = _A(root,"div",{"class":"pg_body", ls:"declines"});
				Declines.renderPage(r,listDOM);
				_A(listDOM, KUI.renderNav(r));
			}

		});
	},
	renderPage:function(r, root){
		_CL(root);
		Enum(r.child_list, function(child){
			_A( root, Declines.renderItem(child) );
		});

	},

	renderItem:function(item){
		var clickSelf=function(){
			PgNav.open("mem",{mem:SSN.id},true);
		};
		var clickMatch=function(){
			if(_N(item.activated)){
				PgNav.open("mem",{mem:item.id},true);
			}else{
				KUI.msgbox({msg:"declines.inactive"});
			}
		};
		var root = _C( "div", {"class":"sresult_root decline_item"} );
		_A( root,"center",{"class":"bold"}, _S("declines.date_matched") + item.date_matched );
		var tbl = _AT( root,{},[{},{"class":"right_align"}]);
		_A( tbl.cols[0], "div", {"class":"login_id"}, _S("a.you") ).onclick=clickSelf;
		_A(_A(tbl.cols[0], "div",{"class":"pic50frame float_left"}),"img",{src:U.picSRC(SSN.main_pic, SSN.gender, true)}).onclick=clickSelf;
		_A( tbl.cols[1], "div", {"class":"login_id"}, item.login_id ).onclick = clickMatch;
		var img = _A( _A(tbl.cols[1],"div",{"class":"pic50frame float_right"}), "img",{src:U.picSRC(item.main_pic, item.gender, true)});
		img.onclick=clickMatch;
		U.disableSelection(img);
		var note = _A( tbl.cols[_N(item.who_declined)],"div",{"class":"note"}, _S("declines.date_declined") + item.date_declined );
		_A( note,"div",{"class":"tahoma left_align"}, item.decline_msg );

		return root;
	}
};