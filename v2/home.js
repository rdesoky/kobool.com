var Home = {
	onload:function(){
			TopTabs.select(null);
			if(!_N(_GC("id"))){
				PgNav.open("mem",{mem:_GC("id")},undef,true);
			}
		//if(!_N(_GC("id"))){
		//	PgNav.downloadPage(
		//		"register", 
		//		"HomeFormPanel",
		//		function(){
		//		}
		//	);
		//}
		//PgNav.downloadPage(
		//	"smp_srch", 
		//	"HomeOptions",
		//	function(){
		//	}
		//);
	}
};