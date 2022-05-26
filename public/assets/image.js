$('#info-form').on('submit', function(event){
    event.preventDefault();
    console.log(`Let's make some ${$("input[name='inlineRadioOptions']:checked").val()}`);

    // idea: temporarily download image, upload to google cloud, get labels
});