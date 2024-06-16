function! fall#internal#highlight#fast(filetype)
  if empty(a:filetype)
    let l:eventignore_saved = &eventignore
    try
      set eventignore+=FileType
      silent! filetype detect
    finally
      let &eventignore = l:eventignore_saved
    endtry
    let l:filetype = &filetype
  else
    let l:filetype = a:filetype
  endif
  silent! execute printf('runtime syntax/%s.vim', fnameescape(l:filetype))
endfunction

function! fall#internal#highlight#correct(filetype)
  if empty(a:filetype)
    silent! filetype detect
  else
    silent! let &filetype=a:filetype
  endif
endfunction
