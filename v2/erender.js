var ERender = {
	featuredMem:function(inf){
		var mpanel = _C("div", {"class":"featured_mem"});
		mpanel.ontooltip=function(){
			var tt = _C("div",{style:"min-width:260px;min-height:120px;"});
			RSCR("MemVUR.vw10",function(){
				_A(tt,MemVUR.vw10.render(inf));
			},{silent:1});
			return tt;
		};
		mpanel.onclick=function(){
			PgNav.open("mem", {mem:inf.id}, ["mtab","ap","rap","myap"]);
		};
		var tbl = _AT(mpanel,{cellspacing:0},[{"class":"gallery_pic"},{"class":"vtop"}]);
		var pic_frame = tbl.cols[0];
		inf.purchased = inf.new_cards = 1;
		this.drawPointsFlag( pic_frame, inf );
		var img=_A( pic_frame,"img",{src:U.picSRC(inf.main_pic,inf.gender,true) } );
		U.disableSelection(img);
		var info = tbl.cols[1];
		_A(info,"div",{"class":"login_id"},inf.login_id);
		if(_D(inf.age)){_A(info,"div",{},inf.age + " " + _S("a.year"));}
		if(_D(inf.country)){
			_HS( _A(info,"div"),"geo:c.v"+inf.country );
		}
		return mpanel;
	},
	drawPointsFlag:function( r, info ){
		if(!_N(info.activated)){
			return;
		}
		r = _E(r);
		var anchor;
		if(r.firstChild && r.firstChild.className=="anchor"){
			anchor = _CL(r.firstChild);
		}else{
			anchor = r.insertBefore( _C("div",{"class":"anchor"}), r.firstChild );
		}
		if( _N( info.purchased ) ){
			if( _N( info.new_cards ) ){
				_A( anchor, "span", {"class":"cimg box12 absolute abs_right new_points_icon", tip:"help:tips.has_new_cards"} );
			}else{
				_A( anchor, "span", {"class":"cimg box12 absolute abs_right old_points_icon", tip:"help:tips.purchased_cards"} );
			}
		}
		if( _N( info.blocked ) ){
			var addBlockedIcon=function(){
				_A( anchor, "img", 
					{	"class":"absolute abs_left", 
						src:"/images/stop.png",
						"style":"height:auto;width:" + r.offsetWidth + "px"
					}
				);
			};
			setTimeout( function(){
				if(r.offsetWidth){
					addBlockedIcon();
				}else{//shown in tooltip, still hidden
					setTimeout(addBlockedIcon,1000);
				}
			}, 1 );
		}
	}
};
