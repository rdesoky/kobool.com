var CDataViewer = {
	init:function( info ){
		this.info = info;
		this.extend(CSelector.classDef);
	},
	selectRow:function(id,attr){
		this.selRow=id;
		if( this.dom && this.dom.childNodes && this.dom.childNodes.length > 1 ){
			var ndx = this.getRowIndex(id,attr);
			if(ndx!=-1){
				this.select(this.dom.childNodes[1].childNodes[ndx]);
			}else{
				this.select(null);
			}
		}
	},
	getRowIndex:function(val, attr){
		if(!_D(attr)){
			attr = "id";
		}
		var ndx = -1;
		if(this.data && this.data.child_list){
			Enum(this.data.child_list,function(child, index){
				if(child[attr]==val){
					ndx = index;
				}
			});
		}
		return ndx;
		
	},
	refresh:function( render ){
		if(render){
			this.render(true);
		}else{
			delete this.data;
		}
	},
	render:function( bRefresh ){
		var self = this;
		
		if(!this.dom){
			this.dom = _C("div",{"class":"dv_root"}, KUI.getProgress());
		}
		
		if( !this.dom.firstChild ){//first creation or IE destroys children 
			//this.scroller = _A(this.dom,this.renderScroller());
			//_A( this.dom,this.renderHeader() );
			this.bRend = false;//force data rendering
		}

		if( !this.info.cgi ){
			return _CL(this.dom);
		}
		
		if( bRefresh || !_D(this.data) ){
			this.bRend = false;
			DU.blockPr(this.dom);
			Http.getCGI(this.info.cgi, 	this.info.query, function(res,xml){
				_CL(self.dom);
				_H("Debug",res);
				if(xml&&xml.documentElement){
					self.data = Http.xml2JS(xml);
				}else{
					self.data = JSN(res);
				}
				self.render();
				if(self.info.onDataResponse){
					self.info.onDataResponse(self.data,res,xml);
				}
			});
		}else{
			if( !this.bRend ){
				//this.dom.style.height = "auto";
				_A( this.dom, this.renderHeader() );
				_A( this.dom, this.renderTable() );
				this.footer = _A( this.dom,"div",{"class":"dv_footer right_align"} );
				
				_A( _A(this.footer, "div", {"class":"inline "}), 
					KUI.renderNav( this.data,
						function(p){
							self.gotoPg(p);
						}
					)
				);
				this.bRend = true;
			}
		}
		return this.dom;
	},
	setQuery:function(q, cgi, upd){

		if( !U.equalObjects(q, this.info.query, {p:1}) ){
			this.info.query = U.copyObject(q);
			upd = true;
		}

		if( _D(cgi) && this.info.cgi != cgi){
			this.info.cgi = cgi;
			upd = true;
		}
		if(upd){
			this.gotoPg(0);
		}
	},
	resizeColumn:function(col, width){
		if( this.dom ){
			Enum( this.dom.childNodes, function(node){
				node.childNodes[col].style.width = width.toString() + "px";
				
			});
		}
	},
	gotoNextPg:function(){
		if( _N(this.data.page)<Math.floor(_N(this.data.total-1)/_N(this.data.page_size)) ){
			this.gotoPg(_N(this.data.page)+1);
		}
	},
	gotoPrevPg:function(){
		if(_N(this.data.page)>0){
			this.gotoPg(_N(this.data.page)-1);
		}
	},
	gotoPg:function(p){
		this.info.query.p=p;
		this.render(true);
	},
	renderHeader:function(){
		var d = _C("div",{"class":"dv_header"});
		var info = this.info;
		Enum( this.info.col, function(val,key){
			var cinfo = info.col[key];
			if(cinfo.width){
				_A(d,"span",{'class':"dv_header_cell",style:"width:"+cinfo.width+"px"},info.col[key].title||"&nbsp;");
			}
		});
		return d;
	},
	renderRow:function(row){
		var d = _C("div",{"class":"dv_row"});
		if( this.info.rowClass ){
			DU.addClass(d, this.info.rowClass(row) );
		}
		if( this.selRow && (this.selRow == row.id) ){
			this.select(d);
		}
		var info = this.info;
		var self = this;
		Enum( this.info.col, function(val,key){
			var cinfo = info.col[key];
			if(cinfo.width){
				var c = _A(d,"span",{'class':"dv_cell",style:"width:"+cinfo.width+"px"});
				if(cinfo.css){
					DU.addClass(c, cinfo.css);
				}
				if(info.onclick){
					c.onclick=function(e){
						var conclick;
						if(cinfo.onclick){
							conclick = c.onclick=function(e){cinfo.onclick.call(self,row,cinfo);};
						}
						if(conclick!==false){
							info.onclick.call(self,row,cinfo);
						}
					};
				}else if(cinfo.onclick){
					c.onclick=function(e){cinfo.onclick.call(self,row,cinfo);};
				}
				if(cinfo.render){
					_A(c,cinfo.render(row,self,d,c));
				}else{
					c.innerHTML = row[info.col[key].fld]||"&nbsp;";
				}
				_SA(c,{tip:cinfo.tip,tipw:cinfo.tipw});
				if(cinfo.ontooltip){
					c.ontooltip = function(){
						return cinfo.ontooltip(row,c);
					};
				}
			}
		});
		return d;
	},
	renderTable:function(){
		var root= _C("div", {"class":"dv_table"});
		var self = this;	
		var onWScroll = function(e){
			DU.cancelBubble(evt);
			
			var wDelta = evt.wheelDelta;
		
			if(wDelta<-100){
				self.gotoNextPg();
			}
			else if(wDelta>100){
				self.gotoPrevPg();
			}
			
			return false;
		};
		//if( window.addEventListener ){
		//	root.addEventListener("DOMMouseScroll", onWScroll, false);
		//}else if(root.attachEvent){
		//	root.attachEvent("onmousewheel", onWScroll );
		//}
		//root.onmousewheel = root.onmousewheel = onWScroll;
		
		
		var self=this;
		if(!this.data.child_list||!this.data.child_list.length){
			_A(root, "div", {"class":"white_bg light_txt"}, _S("a.no_results"));
		}else{
			Enum( this.data.child_list, function(val){
				_A(root, self.renderRow(val));
			});
		}
		return root;
	}
};

CDataViewer = DefineJClass( CDataViewer );