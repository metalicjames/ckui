function populateOutputTable(accounts) {
    for(var i = 0; i < accounts.length; i++) {    
        $.jsonRPC.request('listunspentoutputs', {
          params: {"account": accounts[i]["name"]},          
          success: function(result) {
                if(result["result"] != null) {
                    for(var j = 0; j < result["result"]["outputs"].length; j++) {
                        var output = result["result"]["outputs"][j];
                        var contract = "";
                        if(output["data"] != null) {
                            if(typeof output["data"]["contract"] != 'undefined') {
                                contract = output["data"]["contract"];
                            }
                        }
                        $("#outputs_list_table").append("<tr class=\"unspent_output\"><td><div>" + output["id"] + "</div></td><td><div>" 
                                                                   + output["publicKey"] + "</div></td><td><div>"
                                                                   + (output["value"] / 100000000.0) + "</div></td><td><div>"
                                                                   + contract + "</div></td></tr>");
                    }
                }
          },
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
        });
    }
}

$(document).on("click", ".unspent_output", function() {    
    if($(this).parent().attr("id") == "pending_outputs_table") {
        $("#outputs_list_table").append($(this));
    } else if($(this).parent().parent().attr("id") == "outputs_list_table") {
        $("#pending_outputs_table").append($(this));
    }
});

$(document).ready(function() {

$.jsonRPC.setup({
  endPoint: 'http://localhost:8383/',
  namespace: ''
});

$.jsonRPC.request('getinfo', {
  params: {},
  success: function(result) {
    $("#server_info").html("<p>CK Version: " + result["result"]["CK Version"] 
			  + "<br>RPC Version: " + result["result"]["RPC Version"] 
                          + "<br>Height: " + result["result"]["height"] 
                          + "<br>Balance: " + result["result"]["balance"] 
                          + "<br>Connections: " + result["result"]["connections"] + "</p>");
  },
  error: function(result) {
      throw new Error(result["error"]["message"]);    
  }
});

$.jsonRPC.request('listaccounts', {
  params: {},
  success: function(result) {
    var accounts = result["result"]["accounts"];
    populateOutputTable(accounts);
  },
  error: function(result) {
      throw new Error(result["error"]["message"]);    
  }
});

});
