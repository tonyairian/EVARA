//Delete product images
function deleteProductImage(prodId,imgName){
    $.ajax({
        url:'remove-product-image/'+prodId+'/'+imgName,
        type: 'GET',
        success: function(response) {
           if(response){
            const imgDir = document.getElementById('edit-product-images')
            const img = document.getElementById(imgName)
            imgDir.removeChild(img)
           }
        }
    })
}