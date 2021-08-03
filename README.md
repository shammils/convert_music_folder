ISSUE: you have terabytes of lossless music with painstakenly managed cover art and scans. Its a PITA to lug around the entire collection due to its size. Other conversion tools dont behave as desired and you lose all the artwork. Its unfeasible to manually copy the artwork over to the converted files because humans only live so long.
Solution: this tool. no one else should try to use it, its basically a permanent one off, like just about everything else I build.

requires 'sox' to be installed. uses the 'cp' command so the pool is closed for windows

runs serially, so start the process a few days before you actually need to use the result. god forbid it fails for any reason during that time.

Fixed a ton of bugs:
  - overwriting populated albums
  - losing certain files for unknown reasons
  - only processing one nested folder

TODO
  support consuming a json file with paths to files? mendokusai mitai na. I want
  something interactive but im too lazy to write that.
  
BUGS:
- this file isnt making it
  /home/kisama/Music/in_test/3t1a.net (ETIA.) - #D3V1L [ETIA-0006] (M3-43)/Artwork/cover.png

- Intersection Fractional 2 failed to organize for some reason, will look at it
  later. for now, processing what we have

- HORRID BUG: dont name the incoming folder something that could appear in the
  name of a song... shit
