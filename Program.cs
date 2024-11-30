//using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

//builder.Services.AddResponseCompression(options =>
//{
//    options.EnableForHttps = true;
//    options.Providers.Add<GzipCompressionProvider>();
//});

builder.Services.AddResponseCaching(options =>
{
    options.MaximumBodySize = 314572800;
    options.UseCaseSensitivePaths = true;
});

var app = builder.Build();

//app.UseResponseCompression();
app.UseResponseCaching();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".7z"] = "application/x-msdownload";
provider.Mappings[".zip"] = "application/x-msdownload";
provider.Mappings[".db"] = "application/x-msdownload";
provider.Mappings[".json"] = "application/json";
provider.Mappings[".webp"] = "image/webp";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "databases")),
    RequestPath = "/Data",
    ContentTypeProvider = provider,
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "img", "maps")),
    RequestPath = "/MapImages",
    ContentTypeProvider = provider,
});


app.UseRouting();

app.UseAuthorization();
//app.UseResponseCompression();

app.MapRazorPages();

app.Run();