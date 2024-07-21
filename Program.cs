using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

//builder.Services.AddResponseCompression(options =>
//{
//    //options.Enable = true;
//    //options.Providers.Add<GzipCompressionProvider>();
//});

builder.Services.AddResponseCaching(options =>
{
    options.MaximumBodySize = 314572800;
    options.UseCaseSensitivePaths = true;
});

/*builder.Services.AddMvc(options =>
{
    options.CacheProfiles.Add("Default",
        new Microsoft.AspNetCore.Mvc.CacheProfile()
        {
            Duration = 17408, //86400,
            Location = Microsoft.AspNetCore.Mvc.ResponseCacheLocation.Any,
        });
});*/

var app = builder.Build();

//app.UseResponseCompression();
app.UseResponseCaching();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".gzip"] = "application/x-msdownload";
provider.Mappings[".7z"] = "application/x-msdownload";
provider.Mappings[".zip"] = "application/x-msdownload";
provider.Mappings[".db"] = "application/x-msdownload";
provider.Mappings[".json"] = "application/json";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "databases")),
    RequestPath = "/Data",
    ContentTypeProvider = provider,
});


app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();