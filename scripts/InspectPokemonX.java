import java.nio.file.*;
import java.util.*;
import ctrmap.formats.garc.GARC;
import ctrmap.formats.h3d.H3DModelNameGet;
import ctrmap.formats.text.GFMessageFile;

/** Read-only archive inspection. Extracted source files stay under ignored storage/app. */
public class InspectPokemonX {
    static int u16(byte[] b,int p){return (b[p]&255)|((b[p+1]&255)<<8);}
    static int i32(byte[] b,int p){return u16(b,p)|(u16(b,p+2)<<16);}
    static byte[] part(byte[] b,int i){return Arrays.copyOfRange(b,i32(b,4+i*4),i32(b,8+i*4));}
    public static void main(String[] args) throws Exception {
        Path root=Paths.get("storage/app/pokemon-x-tools");
        for(String path:args){
            GARC g=new GARC(root.resolve("romfs/"+path).toFile());
            Path out=root.resolve("unpacked/"+path); Files.createDirectories(out);
            List<String> index=new ArrayList<>();
            System.out.println(path+": "+g.length+" entries");
            for(int i=0;i<g.length;i++){
                byte[] b=g.getDecompressedEntry(i);
                Files.write(out.resolve(i+".bin"),b);
                String info="";
                try {
                    if(path.equals("a/0/7/4") && i==72){
                        List<String> lines=GFMessageFile.getStrings(b);
                        for(int n=0;n<lines.size();n++) info+=n+"="+lines.get(n)+"\n";
                    } else if(b.length>16 && (new String(b,0,2).equals("GR") || new String(b,0,2).equals("MM"))){
                        byte[] model=part(b,new String(b,0,2).equals("GR")?1:0);
                        if(model.length>4 && model[0]=='B')info=H3DModelNameGet.H3DModelNameGet(model);
                    }
                } catch(Exception e){info="parse: "+e.toString();}
                index.add(i+"\t"+b.length+"\t"+new String(b,0,Math.min(2,b.length))+"\t"+info);
            }
            Files.write(out.resolve("index.txt"),index);
        }
    }
}
