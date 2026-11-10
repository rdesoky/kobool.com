U.nameSpace("MemVUR");
MemVUR.vw25 = {
	render:function(inf){
		var attrs = {"class":"mem_thumb inline vtop"};
		if( _N(inf.id) && inf.id != 0 && !document.getElementById("Member_"+inf.id) ){
			attrs.id = "Member_" + inf.id;
		}
		var root = _C("div", attrs);
		var tbl = _AT(root,{cellspacing:0},[{"class":"gallery_pic"},{"class":"vtop"}]);
		var pic_frame = tbl.cols[0];
		var img = _A( pic_frame,"img",{src:U.picSRC(inf.main_pic,inf.gender,true) } );
		U.disableSelection(img);
		
		_A(tbl.cols[1],"div",{"class":"login_id"},inf.login_id);

		if(! _N(inf.id) ){
			_A(tbl.cols[1],"div", {'class':"padding under_review"}, _S("a.hidden_mem"));
			return root;
		}

		if(!_N(inf.activated)){
			_A(tbl.cols[1],"div",{"class":"attr"},_S("a.inactive"));
		}
		root.ontooltip=function(){
			var tt = _C("div",{style:"min-width:260px;min-height:120px;"});
			RSCR("MemVUR.vw10",function(){
				_A(tt,MemVUR.vw10.render(inf));
			},{silent:1});
			return tt;
		};
		root.onclick=function(){
			PgNav.open("mem", {mem:inf.id}, ["mtab","ap","rap","myap","tn"]);
		};

		RSCR("ERender",function(){
			ERender.drawPointsFlag( pic_frame, inf );
		},{silent:1});
		if(_D(inf.age)){_A(tbl.cols[1],"div",{"class":"attr"},inf.age + " " + _S("a.year"));}
		if(_D(inf.country)){
			_HS( _A(tbl.cols[1],"div",{"class":"attr"}),"geo:c.v"+inf.country );
		}

		return root;
	}
};