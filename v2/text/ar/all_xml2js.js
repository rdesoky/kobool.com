//WScript.Echo(WScript.FullName);

var gReserved = "[break][delete][function][return][typeof][case][do][if][switch][var][catch][else][in][this][void][continue][false][instanceof][throw][while][debugger][finally][new][true][with][default][for][null][try][abstract][double][goto][native][static][boolean][enum][implements][package][super][byte][export][import][private][synchronized][char][extends][int][protected][throws][class][final][interface][public][transient][const][float][long][short][volatile]";

String.prototype.replaceAll = function( sFind, sReplace ){
	var re = RegExp( sFind , "gi" );
	return this.replace( re, sReplace );
};

var gAllStrings = [
	"countries",	"layout",		"login",		"help",			"search", 
	"home",			"errors",		"profile",		"qa",			"info", 
	"options",		"contact",		"who",			"press",		"stats",
	"pics",			"activation",	"matching",		"visiting_help","chg_email", 
	"s_help",		"tell",			"forgot",		"chg_pass",		"kpay",
	"scr_banner"
];


for( var i=0; i<gAllStrings.length; i++ )
{
	var fileName = gAllStrings[i] + ".xml";
	
	WScript.Echo( "c:\\websites\\kobool.com\\res\\ar\\strings\\" + fileName + " (1, 1)" );

	var xmlParser = new ActiveXObject("Microsoft.XMLDOM");
	xmlParser.load( fileName );

	var fso = new ActiveXObject("Scripting.FileSystemObject");

	var rootNode = xmlParser.selectSingleNode("*");
	var gXmlRoot;

	if(rootNode){
		var sHash = "try{OnLoadScriptFile(\"" + fileName + "\")}catch(e){};var " + fileName.replace(".xml", "")  + "_strSRC ={" + node2Hash(rootNode,1) + "\n};";
		//WScript.Echo( sHash );

		var out_file = fso.createTextFile(fileName + ".js", true);//, true);
		if(out_file){
			out_file.write(sHash);
			out_file.close();
		}else{
			WScript.Echo("couldn't open file: " + fileName + ".js");
		}
	}
	else
	{
		WScript.Echo("couldn't parse XML file: " + fileName );
	}
}

function node2Hash(xmlNode, indent)
{
	var i, j;

	//var sRetValue = ( IsReservedWord( xmlNode.tagName ) ? ( "\"" + xmlNode.tagName + "\"" ) : xmlNode.tagName ) + ":";
	
	if(IsReservedWord( xmlNode.tagName ))
		WScript.Echo("Reserved Word:" + xmlNode.tagName);

	sRetValue = xmlNode.tagName + ":";

	if( xmlNode.getAttribute("value") ){
		sRetValue = "v" + xmlNode.getAttribute("value") + ":";
	}

	sRetValue += "{";

	for (var i=0; xmlNode.childNodes && i<xmlNode.childNodes.length ; i++)
	{
		if(xmlNode.childNodes[i].tagName)
		{
			sRetValue += (i>0) ? "," + newLine(indent) : "";
			sRetValue += node2Hash(xmlNode.childNodes[i],indent+1);
		}
		else
		{
			sRetValue += "t:\"" + JScriptString( xmlNode.childNodes[i].text ) + "\"";
		}
	};

	if( xmlNode.attributes && xmlNode.attributes.length)
	{
		for (var j=0; j<xmlNode.attributes.length; j++)
		{
			sRetValue += ( j > 0 || i > 0) ? ", " : "";
			sRetValue += xmlNode.attributes[j].name + ":\"" + xmlNode.attributes[j].value + "\"";

		};
	}


	sRetValue += newLine(indent) + "}";
	
	return sRetValue;
		
}


function newLine( indent )
{
	return "";

	var sRetValue = "\n";
	for (var i=0;i<indent ; i++)
	{
		sRetValue += "\t";
	}

	return sRetValue;
}

function JScriptString( str )
{
	str = str.replaceAll("\\\\", "\\\\");
	//str = str.replaceAll("'", "\\x27");
	str = str.replaceAll("\"", "\\\"");
	str = str.replaceAll("\\n", "\\n");
	return str;
}

function IsReservedWord( sWord )
{
	return ( gReserved.indexOf( "[" + sWord + "]") >= 0 );
}