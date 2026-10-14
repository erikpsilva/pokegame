using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using Ohana3DS_Transfigured.Ohana;
using Ohana3DS_Transfigured.Ohana.Models;
using Ohana3DS_Transfigured.Ohana.Animations;

// Reads BCH/GfMotion using gdkchan's Ohana3DS parser. No writes to the ROM.
class ExportPokemonX {
    static float[] V(RenderBase.OVector3 v){return new float[]{v.x,v.y,v.z};}
    static byte[] Part(byte[] b,int i){int p=BitConverter.ToInt32(b,4+i*4),e=BitConverter.ToInt32(b,8+i*4);return b.Skip(p).Take(e-p).ToArray();}
    static void Main(string[] args){
        if(args[0]=="textures"){
            Directory.CreateDirectory(args[2]);
            foreach(string file in Directory.GetFiles(args[1],"*.bin")){
                byte[] raw=File.ReadAllBytes(file);
                if(raw.Length<40||raw[0]!='B'||raw[1]!='C'||raw[2]!='H')continue;
                int c=BitConverter.ToInt32(raw,8);if(BitConverter.ToInt32(raw,c+4)!=0)continue;
                var textures=BCH.load(new MemoryStream(raw)).texture;
                foreach(var t in textures)t.texture.Save(Path.Combine(args[2],t.name+".png"),System.Drawing.Imaging.ImageFormat.Png);
            }
            Console.WriteLine("Textures exported");return;
        }
        byte[] b=File.ReadAllBytes(args[0]);
        string output=args[1];Directory.CreateDirectory(output);
        int slot=args.Length>2?int.Parse(args[2]):-1;
        var group=BCH.load(new MemoryStream(slot<0?b:Part(b,slot)));
        foreach(var t in group.texture){t.texture.Save(Path.Combine(output,t.name+".png"),System.Drawing.Imaging.ImageFormat.Png);}
        var models=group.model.Select(m=>new {
            name=m.name,
            bones=m.skeleton.Select(s=>new {name=s.name,parent=s.parentId,position=V(s.translation),rotation=V(s.rotation),scale=V(s.scale)}).ToArray(),
            materials=m.material.Select(t=>new {name=t.name,texture=t.name0,texture1=t.name1,texture2=t.name2}).ToArray(),
            meshes=m.mesh.Select(s=>new {name=s.name,material=s.materialId,
                positions=s.vertices.SelectMany(v=>V(v.position)).ToArray(),
                uv=s.vertices.SelectMany(v=>new float[]{v.texture0.x,v.texture0.y}).ToArray(),
                joints=s.vertices.SelectMany(v=>Enumerable.Range(0,4).Select(i=>i<v.node.Count?v.node[i]:0)).ToArray(),
                weights=s.vertices.SelectMany(v=>Enumerable.Range(0,4).Select(i=>i<v.weight.Count?v.weight[i]:(i==0&&v.weight.Count==0?1f:0f))).ToArray()
            }).ToArray()
        }).ToArray();
        var serializer=new JavaScriptSerializer{MaxJsonLength=int.MaxValue,RecursionLimit=200};
        File.WriteAllText(Path.Combine(output,"model.json"),serializer.Serialize(models));
        Console.WriteLine(args[0]+": "+models.Length+" models, "+group.texture.Count+" textures, "+(models.Length>0?models[0].bones.Length:0)+" bones");
        if(args.Length>3){
            var animations=GfMotion.load(new MemoryStream(Part(b,int.Parse(args[3]))));
            File.WriteAllText(Path.Combine(output,"animations.json"),serializer.Serialize(animations));
            Console.WriteLine("Animations: "+animations.Count+" "+String.Join(", ",animations.Select(a=>a.name+":"+a.frameSize+"/"+a.bone.Count)));
        }
    }
}
