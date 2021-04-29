$(document).ready(function () {

  if($('#dataTable').length && $('#totalPrice').length){
    $('#dataTable').DataTable();
    $('input[type="search"]')[0].oninput=update_total;
    update_total();

    function update_total(){
      let tot=0;
      for(let item of $('.prod-price'))
        tot+=+item.innerText;
      document.getElementById('totalPrice').innerText=tot;
    }
  }

});